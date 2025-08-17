import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export const SwapIcon = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isActive = location.pathname === '/swap';

	return (
		<svg width="18" height="18" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M5.00002 5.81942L6.66669 4.15275M6.66669 4.15275L5.00002 2.48608M6.66669 4.15275H5.00002C3.15907 4.15275 1.66669 5.64513 1.66669 7.48608M15 15.8194L13.3334 17.4861M13.3334 17.4861L15 19.1528M13.3334 17.4861H15C16.841 17.4861 18.3334 15.9937 18.3334 14.1528M8.49088 6.23608C9.04593 4.07955 11.0036 2.48608 13.3334 2.48608C16.0948 2.48608 18.3334 4.72466 18.3334 7.48608C18.3334 9.81587 16.7399 11.7735 14.5834 12.3285M11.6667 14.1528C11.6667 16.9142 9.42811 19.1528 6.66669 19.1528C3.90526 19.1528 1.66669 16.9142 1.66669 14.1528C1.66669 11.3913 3.90526 9.15275 6.66669 9.15275C9.42811 9.15275 11.6667 11.3913 11.6667 14.1528Z"
				stroke={isActive ? theme.accent.secondary : theme.text.secondary}
				stroke-width="1.67"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)
}
