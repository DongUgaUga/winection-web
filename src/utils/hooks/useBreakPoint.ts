import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export default function useBreakpoint(): Breakpoint {
	const getBreakpoint = () => {
		if (typeof window === 'undefined') return 'desktop'; // SSR-safe

		const width = window.innerWidth;

		if (width <= 767) return 'mobile';
		if (width <= 1023) return 'tablet';
		return 'desktop';
	};

	const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);

	useEffect(() => {
		const handleResize = () => {
			const next = getBreakpoint();
			if (next !== breakpoint) {
				setBreakpoint(next);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [breakpoint]);

	return breakpoint;
}
