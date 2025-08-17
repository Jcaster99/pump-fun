import React, { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Footer } from './Footer'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
	const { theme, darkMode } = useTheme()
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [isMobile, setIsMobile] = useState(false)

	// Check if we're on mobile on mount and when window resizes
	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768)
			// Auto-close sidebar on mobile
			if (window.innerWidth < 768) {
				setSidebarOpen(false)
			} else {
				setSidebarOpen(true)
			}
		}

		// Initial check
		checkIsMobile()

		// Add resize listener
		window.addEventListener('resize', checkIsMobile)

		// Cleanup
		return () => window.removeEventListener('resize', checkIsMobile)
	}, [])

	// Toggle sidebar
	const toggleSidebar = () => {
		setSidebarOpen((prev) => !prev)
	}

	// Obliczamy szerokość sidebara
	const sidebarWidth = 240

	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<div
				style={{
					backgroundColor: theme.bg.main,
					color: theme.text.primary,
					minHeight: '100vh',
					display: 'flex',
					transition: 'all 0.3s ease',
					position: 'relative',
				}}
			>
				{/* Mobile Sidebar Overlay */}
				{isMobile && sidebarOpen && (
					<div
						style={{
							position: 'fixed',
							inset: 0,
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							zIndex: 40,
							transition: 'opacity 0.3s ease',
						}}
						onClick={toggleSidebar}
					/>
				)}

				{/* Sidebar */}
				<Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={toggleSidebar} />

				{/* Main Content */}
				<div
					style={{
						flex: 1,
						transition: 'margin-left 0.3s ease',
						width: '100%',
						marginLeft: !isMobile && sidebarOpen ? `${sidebarWidth}px` : 0, // Dodajemy margines gdy sidebar jest otwarty na desktopie
						overflowX: 'hidden',
						backgroundImage: darkMode ? 'unset' : 'url(/slop-bg.png)',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundAttachment: 'fixed',
						backgroundRepeat: 'no-repeat',
					}}
				>
					{/* Header with search bar */}
					<Header toggleSidebar={toggleSidebar} isMobile={isMobile} />

					{/* Page Content */}
					<div style={{ padding: '20px', maxWidth: '100%' }}>{children}</div>
				</div>
			</div>
			<Footer isMobile={isMobile} />
		</div>
	)
}

export default Layout
