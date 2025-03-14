const {
  loadFixture
} = require('@nomicfoundation/hardhat-toolbox/network-helpers')
const { expect, assert } = require('chai')
const { ethers } = require('hardhat')

describe('*** VOTING TEST SUITE ***', function () {
  async function deployVotingContract () {
    const [owner, addr2, addr3] = await ethers.getSigners()
    const Voting = await ethers.getContractFactory('Voting')
    const voting = await Voting.deploy(Voting)
    return { voting, owner, addr2, addr3 }
  }

  async function deployVotingAddVoters () {
    const { voting, owner, addr2, addr3 } = await loadFixture(
      deployVotingContract
    )
    await voting.addVoter(owner.address)
    await voting.addVoter(addr2.address)
    await voting.addVoter(addr3.address)
    return { voting, owner, addr2, addr3 }
  }

  async function deployVotingAddVotersAndProposals () {
    const { voting, owner, addr2, addr3 } = await loadFixture(
      deployVotingAddVoters
    )
    await voting.startProposalsRegistering()
    await voting.addProposal('Proposal 1')
    await voting.addProposal('Proposal 2')
    await voting.endProposalsRegistering()
    return { voting, owner, addr2, addr3 }
  }

  async function deployVotingAddVotersAndProposalsAndStartVotingSession () {
    const { voting, owner, addr2, addr3 } = await loadFixture(
      deployVotingAddVotersAndProposals
    )
    await voting.startVotingSession()
    return { voting, owner, addr2, addr3 }
  }

  async function deployVotingAddVotersAndProposalsAndVote () {
    const { voting, owner, addr2, addr3 } = await loadFixture(
      deployVotingAddVotersAndProposals
    )
    await voting.startVotingSession()
    await voting.setVote(1)
    await voting.connect(addr2).setVote(2)
    await voting.connect(addr3).setVote(2)
    await voting.endVotingSession()
    return { voting, owner, addr2, addr3 }
  }

  describe('STAGE #1 - Contract Deployment', function () {
    it('Should deploy the Voting smart contract with msg.sender as the owner', async function () {
      const { voting, owner } = await loadFixture(deployVotingContract)
      expect(await voting.owner()).to.equal(owner.address)
    })
  })

  describe('STAGE #2 - Voters Registering', function () {
    let _voting
    let _owner
    let _addr2
    beforeEach(async function () {
      const { voting, owner, addr2 } = await loadFixture(deployVotingContract)
      _voting = voting
      _owner = owner
      _addr2 = addr2
    })

    it('Should let only the owner add new voters', async function () {
      await expect(_voting.addVoter(_addr2.address)).not.to.be.reverted
    })

    it('Should let only the owner add new voters', async function () {
      await expect(_voting.connect(_addr2).addVoter(_addr2.address))
        .to.be.revertedWithCustomError(_voting, 'OwnableUnauthorizedAccount')
        .withArgs(_addr2.address)
    })

    it("Should allow the voter's address to be provided during the voter registering stage", async function () {
      await _voting.addVoter(_addr2.address)
      const status = await _voting.workflowStatus()
      expect(status).to.equal(0) // 0 <=> registering voters stage
    })

    it('Should register the voter the first time but revert if altready registered', async function () {
      await _voting.addVoter(_owner)
      const voter = await _voting.getVoter(_owner.address) // returns a voter struct instance

      expect(await voter.isRegistered).equal(true)
      await expect(_voting.addVoter(_owner)).to.be.revertedWith(
        'Already registered'
      )
    })

    it('Should trigger the VoterRegistered event when a voter is added', async function () {
      await expect(_voting.addVoter(_addr2.address))
        .to.emit(_voting, 'VoterRegistered')
        .withArgs(_addr2.address)
    })
  })

  describe('STAGE #3 - Proposals Registration', function () {
    let _voting
    let _addr2
    beforeEach(async function () {
      const { voting, addr2 } = await loadFixture(deployVotingAddVoters)
      _voting = voting
      _addr2 = addr2
    })

    describe('STAGE #3 - 1 : Starting proposals registration', function () {
      it('Should not be possible to Start Proposal registering if not in registering voters state', async function () {
        await _voting.startProposalsRegistering()
        await expect(_voting.startProposalsRegistering()).to.be.revertedWith(
          'Registering proposals cant be started now'
        )
      })

      it('should not be possible to add voter after the proposal registration has started', async function () {
        await _voting.startProposalsRegistering()
        await expect(_voting.addVoter(_addr2.address)).to.be.revertedWith(
          'Voters registration is not open yet'
        )
      })

      it('Should allow the owner to start the Proposals Registration', async function () {
        await expect(_voting.startProposalsRegistering()).not.to.be.reverted // owner can start prop reg
      })

      it('Should prevent non-owner from starting Proposals Registration', async function () {
        await expect(_voting.connect(_addr2).startProposalsRegistering()) // this address is not the owner and cannot start prop reg
          .to.be.revertedWithCustomError(_voting, 'OwnableUnauthorizedAccount')
          .withArgs(_addr2.address)
      })

      it('Starting proposal registration should trigger the WorkflowStatusChange event', async function () {
        await expect(_voting.startProposalsRegistering())
          .to.emit(_voting, 'WorkflowStatusChange')
          .withArgs(0, 1)
      })

      it('Only the owner can start the Proposals registration', async function () {
        await expect(_voting.startProposalsRegistering()).not.to.be.reverted // owner can start prop reg
      })

      it('Non-voters cannot start the Proposals registration', async function () {
        await expect(_voting.connect(_addr2).startProposalsRegistering()) // this address is not the owner and cannot start prop reg
          .to.be.revertedWithCustomError(_voting, 'OwnableUnauthorizedAccount')
          .withArgs(_addr2.address)
      })

      it('At the beginning, only the GENESIS proposal is recorded', async function () {
        await _voting.startProposalsRegistering()
        const prop = await _voting.getOneProposal(0)
        assert(prop.description == 'GENESIS')
        await expect(_voting.getOneProposal(1)).to.be.revertedWithPanic(0x32) // out of bound
      })
    })

    describe('STAGE #3 - 2 : Adding proposals', function () {
      it('Only voters can add Proposals ', async function () {
        await _voting.startProposalsRegistering()
        await expect(_voting.addProposal('blabla')).not.to.be.reverted // owner can add proposals
      })

      it('Non-voters cannot add Proposals', async function () {
        const addrs = await ethers.getSigners()
        const _addr4 = addrs[3] // 4th account (unregistered voter)

        await expect(
          _voting.connect(_addr4).addProposal('glouglou')
        ).to.be.revertedWith("You're not a voter")
      })

      it('Prop submission cannot start if state is not Prop Reg Started', async function () {
        await expect(_voting.addProposal('my proposal')).to.be.revertedWith(
          'Proposals are not allowed yet'
        )
      })

      it('Proposal cannot be empty', async function () {
        await _voting.startProposalsRegistering()
        await expect(_voting.addProposal('')).to.be.revertedWith(
          'Vous ne pouvez pas ne rien proposer'
        )
      })

      it('Proposals should trigger the ProposalRegistered event', async function () {
        await _voting.startProposalsRegistering()
        await expect(_voting.addProposal('my proposal'))
          .to.emit(_voting, 'ProposalRegistered')
          .withArgs(1) // 'GENESIS' + 'my proposal' => (array.length - 1) = 1

        // another proposal from a registered voter :
        await expect(_voting.connect(_addr2).addProposal('another proposal')) // this address can submit a proposal
          .to.emit(_voting, 'ProposalRegistered')
          .withArgs(2) // 'GENESIS' + 'my proposal' + 'another proposal' => (array.length - 1) = 2
      })

      it('Recorded proposals should be checkable', async function () {
        await _voting.startProposalsRegistering()
        await _voting.addProposal('my proposal')
        const proposal = await _voting.getOneProposal(1)
        assert(proposal.description == 'my proposal')
      })
    })

    describe('STAGE #3 - 3 : Ending proposals registration', function () {
      it('Should not allow to end the proposal registration if the workflow state is incorrect', async function () {
        await expect(_voting.endProposalsRegistering()).to.be.revertedWith(
          'Registering proposals havent started yet'
        )
      })

      it('End proposal reg should not revert if the workflow state is correct', async function () {
        await _voting.startProposalsRegistering()
        await expect(
          _voting.endProposalsRegistering()
        ).not.to.be.revertedWithCustomError(
          _voting,
          'OwnableUnauthorizedAccount'
        )
      })

      it('Should not be possible to end proposal registration if it is not the owner', async function () {
        await expect(_voting.connect(_addr2).endProposalsRegistering())
          .to.be.revertedWithCustomError(_voting, 'OwnableUnauthorizedAccount')
          .withArgs(_addr2.address)
      })

      it('Ending proposal registration should trigger the WorkflowStatusChange event', async function () {
        await _voting.startProposalsRegistering()
        await expect(_voting.endProposalsRegistering())
          .to.emit(_voting, 'WorkflowStatusChange')
          .withArgs(1, 2)
      })

      it('Cannot start the voting session if proposals registration is not finished', async function () {
        await expect(_voting.startVotingSession()).to.be.revertedWith(
          'Registering proposals phase is not finished'
        )
      })
    })
  })

  describe('STAGE #4 - Voting Session', function () {
    let _voting
    let _addr2
    beforeEach(async function () {
      const { voting, addr2 } = await loadFixture(
        deployVotingAddVotersAndProposals
      )
      _voting = voting
      _addr2 = addr2
    })

    describe('STAGE #4 - 1 : Starting the voting session', function () {
      it('Only the owner can start the voting session', async function () {
        await expect(_voting.startVotingSession()).not.to.be.reverted // owner can start the voting session
      })

      it('Non-owners cannot start the voting session', async function () {
        await expect(_voting.connect(_addr2).startVotingSession()) // this address is not the owner and cannot start prop reg
          .to.be.revertedWithCustomError(_voting, 'OwnableUnauthorizedAccount')
          .withArgs(_addr2.address)
      })

      it('Should start the voting session if the workflow state is correct', async function () {
        await expect(_voting.startVotingSession()).not.to.be.reverted
      })

      it('Starting voting session should trigger the WorkflowStatusChange event', async function () {
        await expect(_voting.startVotingSession())
          .to.emit(_voting, 'WorkflowStatusChange')
          .withArgs(2, 3)
      })

      it('Should not be possible to vote before the voting session has started', async function () {
        await expect(_voting.setVote(2)).to.be.revertedWith(
          'Voting session havent started yet'
        )
      })

      it("Should not be possible to end the vote session if it hasn't started", async function () {
        await expect(_voting.endVotingSession()).to.be.revertedWith(
          'Voting session havent started yet'
        )
      })
    })

    describe('STAGE #4 - 2 : Voting & Ending Voting', function () {
      beforeEach(async function () {
        const { voting, addr2, addr3 } = await loadFixture(
          deployVotingAddVotersAndProposalsAndStartVotingSession
        )
        _voting = voting
        _addr2 = addr2
      })

      describe('STAGE #4 - 2 - 1 : Voting', function () {
        it('Registered voters are allowed to vote', async function () {
          await expect(_voting.setVote(1)).not.to.be.reverted // owner is a registered voter and can vote
          await expect(_voting.connect(_addr2).setVote(2)).not.to.be.reverted // _addr2 is a valid voter
        })

        it('Non-voters are prevented from voting', async function () {
          const addrs = await ethers.getSigners()
          const _addr4 = addrs[3] // 4th account (unregistered voter)

          await expect(_voting.connect(_addr4).setVote(1)).to.be.revertedWith(
            "You're not a voter"
          )
        })

        it('Voters cannot vote twice', async function () {
          await _voting.setVote(1)
          await expect(_voting.setVote(2)).to.be.revertedWith(
            'You have already voted'
          )
        })

        it('Voter can vote only for existing proposals', async function () {
          await expect(_voting.setVote(3)).to.be.revertedWith(
            'Proposal not found'
          )
          await expect(_voting.setVote(0)).not.to.be.reverted // Genesis proposal
        })

        it('Voting should trigger the Voted event', async function () {
          await expect(_voting.connect(_addr2).setVote(1))
            .to.emit(_voting, 'Voted')
            .withArgs(_addr2.address, 1)
        })
      })

      describe('STAGE #4 - 2 - 2 : Ending voting session', function () {
        it('The owner can end the voting session', async function () {
          await expect(_voting.endVotingSession()).not.to.be.reverted // owner can stop the voting session
        })

        it('Non-owners cannot end the voting session', async function () {
          await expect(_voting.connect(_addr2).endVotingSession()) // this address is not the owner and cannot end voting session
            .to.be.revertedWithCustomError(
              _voting,
              'OwnableUnauthorizedAccount'
            )
            .withArgs(_addr2.address)
        })

        it('Should end the voting session if the workflow state is correct', async function () {
          await expect(_voting.endVotingSession()).not.to.be.reverted
        })

        it('Ending the voting session should trigger the WorkflowStatusChange event', async function () {
          await expect(_voting.endVotingSession())
            .to.emit(_voting, 'WorkflowStatusChange')
            .withArgs(3, 4)
        })

        it('Starting vote tallying is not possible', async function () {
          await expect(_voting.tallyVotes()).to.be.revertedWith(
            'Current status is not voting session ended'
          )
        })
      })
    })
  })

  describe('STAGE #5 - Vote Tallying', function () {
    beforeEach(async function () {
      const { voting, addr2, addr3 } = await loadFixture(
        deployVotingAddVotersAndProposalsAndVote
      )
      _voting = voting
      _addr2 = addr2
      _addr3 = addr3
    })

    describe('STAGE #5 - 1 : Vote tallying', function () {
      it('The owner can tally votes', async function () {
        await expect(_voting.tallyVotes()).not.to.be.reverted // owner can stop the voting session
      })

      it('Non-owners cannot tallly votes', async function () {
        await expect(_voting.connect(_addr2).tallyVotes()) // this address is not the owner and cannot tally
          .to.be.revertedWithCustomError(_voting, 'OwnableUnauthorizedAccount')
          .withArgs(_addr2.address)
      })

      it('Check the vote of a voter', async function () {
        const voter = await _voting.getVoter(_addr3.address)
        assert(voter.votedProposalId == 2)
      })

      it('Should tally votes only if the voting session has ended', async function () {
        await expect(_voting.tallyVotes()).not.to.be.reverted // the fixture function has already ended the voting session
      })

      it('Check the winning proposal', async function () {
        expect(await _voting.winningProposalID()).to.be.equal(0)
        await _voting.tallyVotes()
        expect(await _voting.winningProposalID()).to.be.equal(2)
      })

      it('Control the tally computation', async function () {
        const proposal2 = await _voting.getOneProposal(2)
        assert(proposal2.voteCount == 2) // 2 votes for proposal #2 vs 1 vote for proposal #1
      })

      it('The vote tallying should trigger the WorkflowStatusChange event', async function () {
        await expect(_voting.tallyVotes())
          .to.emit(_voting, 'WorkflowStatusChange')
          .withArgs(4, 5)
      })
    })

    describe('STAGE #5 - 2 : Additionnal checks', function () {
      it('Only voters can request voter information', async function () {
        const addrs = await ethers.getSigners()
        const _addr4 = addrs[3] // 4th account (unregistered voter)
        await expect(
          _voting.connect(_addr4).getVoter(_addr3.address)
        ).to.be.revertedWith("You're not a voter")
      })

      it('Only voters can request proposal information', async function () {
        const addrs = await ethers.getSigners()
        const _addr4 = addrs[3] // 4th account (unregistered voter)
        await expect(
          _voting.connect(_addr4).getOneProposal(1)
        ).to.be.revertedWith("You're not a voter")
      })
    })
  })
})
