import { useParams } from "react-router-dom";
import PCGeneralCallPage from "./PCCallPage/PCGeneralCallPage";
import PCEmergencyCallPage from "./PCCallPage/PCEmergencyCallPage";
import MobileGeneralCallPage from "./MobileCallPage/MobileGeneralCallPage";
import MobileEmergencyCallPage from "./MobileCallPage/MobileEmergencyCallPage";
import useBreakpoint from "../../utils/hooks/useBreakPoint";

export default function CallPage() {
  const params = useParams();
  const breakPoint = useBreakpoint();

  const isMobile = breakPoint === 'mobile';

  if (params.calltype === 'general-call') {
    return isMobile ? <MobileGeneralCallPage /> : <PCGeneralCallPage />;
  }

  if (params.calltype === 'emergency-call') {
    return isMobile ? <MobileEmergencyCallPage /> : <PCEmergencyCallPage />;
  }

  return <div>잘못된 접근입니다.</div>;
}
