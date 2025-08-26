import React from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from '../../../context/NavigationContext'
import { useTheme } from '../../../context/ThemeContext'
import '../../../styles/gradient-border.css'

const SidebarItem = ({ icon, label, active, theme, to, onClick }) => {
	const location = useLocation()
	const { darkMode } = useTheme()
	const navigate = useNavigate()

	// If active prop is not provided, determine from current route
	const isActive = active !== undefined ? active : location.pathname === to

	const activeColor = theme.accent.secondary
	// const activeBorderColor = darkMode ? theme.accent.primary : theme.accent.secondary;

	const itemStyle = {
		display: 'flex',
		alignItems: 'center',
		padding: '12px 20px',
		cursor: 'pointer',
		backgroundColor: isActive ? theme.bg.panel : 'transparent',
		color: isActive ? activeColor : theme.text.secondary,
		transition: 'all 0.2s ease',
		textDecoration: 'none',
		margin: '2px 0',
		borderRadius: '1000px',
		fontWeight: '500',
		fontSize: '16px',
	}

	const handleClick = (e) => {
		if (to) {
			e.preventDefault()
			navigate(to)
		}
		if (onClick) onClick()
	}

	// If there's a "to" prop, use a div with onClick that uses our custom navigation
	if (to) {
		return (
			<div className={`${darkMode ? "sidebar-border" : '' }  ${isActive ? 'active' : ''}`}>
				<div style={itemStyle} onClick={handleClick}>
					{icon}
					<span style={{ marginLeft: '10px' }}>{label}</span>
				</div>
			</div>
		)
	}

	// If there's no "to" prop, use a regular div with onClick
	return (
		<div className={`${darkMode ? "sidebar-border" : '' }  ${isActive ? 'active' : ''}`}>
			<div style={itemStyle} onClick={onClick}>
				{icon}
				<span style={{ marginLeft: '10px' }}>{label}</span>
			</div>
		</div>
	)
}

export default SidebarItem
