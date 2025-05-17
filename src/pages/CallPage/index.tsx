import { useParams } from 'react-router-dom';
import useBreakpoint from '../../utils/hooks/useBreakPoint';
import TestUnityPage from '../UnityPlayer/TestUnityPage';
import MobileEmergencyCallPage from './MobileCallPage/MobileEmergencyCallPage';
import MobileGeneralCallPage from './MobileCallPage/MobileGeneralCallPage';
import PCEmergencyCallPage from './PCCallPage/PCEmergencyCallPage';
import PCGeneralCallPage from './PCCallPage/PCGeneralCallPage';

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

	if (params.calltype === 'unity') {
		return <TestUnityPage />;
	}

	return <div>잘못된 접근입니다.</div>;
}
