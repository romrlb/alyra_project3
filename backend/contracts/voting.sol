// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Système de vote décentralisé
/// @author Code original par l'équipe Alyra
/// @notice Ce contrat permet de gérer un système de vote complet
/// @dev Hérite du contrat Ownable d'OpenZeppelin pour la gestion des droits administrateur
contract Voting is Ownable {
    uint public winningProposalID;
    uint private _winningProposalId;

    /// @notice Structure représentant un votant
    /// @dev Stocke le statut et l'historique de vote d'une adresse
    struct Voter {
        bool isRegistered; // Si true, le votant est enregistré
        bool hasVoted; // Si true, le votant a déjà voté
        uint votedProposalId; // Index de la proposition pour laquelle le votant a voté
    }

    /// @notice Structure représentant une proposition de vote
    struct Proposal {
        string description; // Description de la proposition
        uint voteCount; // Nombre de votes reçus
    }

    /// @notice Énumération des différentes étapes du processus de vote
    enum WorkflowStatus {
        RegisteringVoters, // Enregistrement des votants
        ProposalsRegistrationStarted, // Enregistrement des propositions ouvert
        ProposalsRegistrationEnded, // Enregistrement des propositions fermé
        VotingSessionStarted, // Session de vote ouverte
        VotingSessionEnded, // Session de vote fermée
        VotesTallied // Votes comptabilisés
    }

    WorkflowStatus public workflowStatus;
    Proposal[] proposalsArray;
    mapping(address => Voter) voters;

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);

    constructor() Ownable(msg.sender) {}

    /// @notice Vérifie si l'appelant est un votant enregistré
    /// @dev Utilisé comme modifier pour restreindre l'accès aux fonctions aux votants
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    // on peut faire un modifier pour les états

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Récupère les informations d'un votant
    /// @param _addr L'adresse du votant
    /// @return Les informations du votant
    function getVoter(
        address _addr
    ) external view onlyVoters returns (Voter memory) {
        return voters[_addr];
    }

    /// @notice Récupère les détails d'une proposition
    /// @param _id L'index de la proposition
    /// @return La proposition demandée
    function getOneProposal(
        uint _id
    ) external view onlyVoters returns (Proposal memory) {
        return proposalsArray[_id];
    }

    // ::::::::::::: REGISTRATION ::::::::::::: //

    /// @notice Ajoute un nouveau votant
    /// @param _addr L'adresse du votant à ajouter
    /// @dev Peut uniquement être appelé par le propriétaire pendant la phase d'enregistrement
    function addVoter(address _addr) external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration is not open yet"
        );
        require(voters[_addr].isRegistered != true, "Already registered");
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    // ::::::::::::: PROPOSAL ::::::::::::: //

    /// @notice Permet à un votant d'ajouter une proposition
    /// @param _desc La description de la proposition
    /// @dev Vérifie que la phase d'enregistrement des propositions est active
    function addProposal(string calldata _desc) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposals are not allowed yet"
        );
        require(
            keccak256(abi.encode(_desc)) != keccak256(abi.encode("")),
            "Vous ne pouvez pas ne rien proposer"
        ); // facultatif
        // voir que desc est different des autres

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        // proposalsArray.push(Proposal(_desc,0));
        emit ProposalRegistered(proposalsArray.length - 1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    /// @notice Permet à un votant de voter pour une proposition
    /// @param _id L'index de la proposition choisie
    /// @dev Vérifie que la session de vote est active et que le votant n'a pas déjà voté
    /// @dev met à jour le vainqueur potentiel si la proposition a le plus de votes (optimisation/sécu cf. commentaire dédié)
    function setVote(uint _id) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        require(voters[msg.sender].hasVoted != true, "You have already voted");
        require(_id < proposalsArray.length, "Proposal not found"); // pas obligé, et pas besoin du >0 car uint

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;

        // optimisation qui permet de retirer le parcours du tableau des propositions dans la fonction tallyVotes
        uint maxVoteNumber = proposalsArray[_id].voteCount++;
        if (maxVoteNumber > proposalsArray[winningProposalID].voteCount) {
            _winningProposalId = _id;
        }

        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //

    /// @notice Démarre la phase d'enregistrement des propositions
    /// @dev Crée une proposition GENESIS et ne peut être appelé que par le propriétaire
    function startProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Registering proposals cant be started now"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        Proposal memory proposal;
        proposal.description = "GENESIS";
        proposalsArray.push(proposal);

        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted
        );
    }

    /// @notice Termine la phase d'enregistrement des propositions
    function endProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Registering proposals havent started yet"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded
        );
    }

    /// @notice Démarre la session de vote
    function startVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Registering proposals phase is not finished"
        );
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted
        );
    }

    /// @notice Termine la session de vote
    function endVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded
        );
    }

    /// @notice Comptabilise les votes et détermine la proposition gagnante
    /// @dev la proposition ayant le plus de vote a déjà été déterminée par SetVoter()
    function tallyVotes() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Current status is not voting session ended"
        );

        // expose le résultat
        winningProposalID = _winningProposalId;

        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }
}
