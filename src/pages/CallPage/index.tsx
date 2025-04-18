import { useParams } from "react-router-dom"
import GeneralCallPage from "./GeneralCallPage";
import EmergencyCallPage from "./EmergencyCallPage";

export default function CallPage() {
  const params = useParams();

  return (
    <>
      {params.calltype === 'general-call'
      ? <GeneralCallPage />
      : <EmergencyCallPage />
      }
    </>
  )
}