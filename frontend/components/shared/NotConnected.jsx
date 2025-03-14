import { AlertCircle } from "lucide-react"
 
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

const NotConnected = () => {
  return (
    <div>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Please connect your wallet to interact with the platform.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default NotConnected