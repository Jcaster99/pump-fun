import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { fetchTopGravityPools } from '../../api/poolsApi'
import { useNavigate } from '../../context/NavigationContext'
import { useTheme } from '../../context/ThemeContext'
import '../../styles/leaderboard.css'
import '../../styles/ticker.css'
import { SearchComponent } from '../common/SearchComponent'
import { Stack } from '@mui/material'

const PoolsTicker = () => {
	const { theme, darkMode, lasersEnabled } = useTheme()
	const [pools, setPools] = useState([])
	const [loading, setLoading] = useState(true)
	const [isPaused, setIsPaused] = useState(false)
	const tickerRef = useRef(null)
	const tickerContentRef = useRef(null)
	const animationRef = useRef(null)
	// We keep actual scroll position in a ref to avoid triggering React re-renders each frame
	const scrollPosRef = useRef(0)
	const totalWidthRef = useRef(0)
	const navigate = useNavigate()
	const [, setIsMobile] = useState(false)
	const [isSmallScreen, setIsSmallScreen] = useState(false)
	const [isVisible, setIsVisible] = useState(true)

	// Check for screen size
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768)
			setIsSmallScreen(window.innerWidth < 1024)
		}

		checkScreenSize()
		window.addEventListener('resize', checkScreenSize)

		return () => window.removeEventListener('resize', checkScreenSize)
	}, [])

	// Set CSS variables to use our theme colors in the CSS
	useEffect(() => {
		if (theme) {
			document.documentElement.style.setProperty('--text-primary', theme.text.primary)
			document.documentElement.style.setProperty('--text-secondary', theme.text.secondary)
			document.documentElement.style.setProperty('--bg-card', theme.bg.card)
			document.documentElement.style.setProperty('--border', theme.border)
		}
	}, [theme, darkMode])

	// Pause the animation when laser effects are enabled
	useEffect(() => {
		// Zatrzymuj animację gdy lasery są włączone
		if (lasersEnabled) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current)
				animationRef.current = null
			}
			setIsPaused(true)
		} else {
			// Po wyłączeniu laserów - tylko przełącz stan, nie uruchamiaj bezpośrednio animacji
			// Animacja zostanie uruchomiona przez useEffect dla isPaused
			setIsPaused(false)
		}
	}, [lasersEnabled])

	useEffect(() => {
		const loadPools = async () => {
			try {
				setLoading(true)
				// Fetch top 10 pools by Gravity Score
				const response = await fetchTopGravityPools(10)

				// Handle both the new response format (with data property) and old format (array)
				const poolsData =
					response && response.data ? response.data : Array.isArray(response) ? response : []

				// Calculate weighted score for each pool (40% gravity score, 60% market cap)
				const poolsWithWeightedScore = poolsData.map((pool) => {
					// Ensure numeric values
					const gravityScore = parseFloat(pool.gravity_score || 0)

					// Extract market cap value (remove formatting, currency symbols, etc)
					let marketCap = 0
					if (pool.market_cap) {
						marketCap = parseFloat(pool.market_cap)
					} else if (typeof pool.market_cap_formatted === 'string') {
						// Try to parse formatted market cap (e.g. "$1.2M" -> 1200000)
						const cleanedMC = pool.market_cap_formatted.replace(/[$,]/g, '')
						if (cleanedMC.endsWith('M')) {
							marketCap = parseFloat(cleanedMC.slice(0, -1)) * 1000000
						} else if (cleanedMC.endsWith('K')) {
							marketCap = parseFloat(cleanedMC.slice(0, -1)) * 1000
						} else {
							marketCap = parseFloat(cleanedMC) || 0
						}
					}

					// Normalize the values (to prevent one factor from dominating)
					const maxGravity = 1000 // Maximum possible gravity score
					const normalizedGravity = gravityScore / maxGravity

					// For market cap, we'll use a log scale since market caps can vary widely
					// Adding 1 to avoid log(0)
					const normalizedMC = Math.log10(marketCap + 1) / 10 // Divided by 10 to keep in reasonable range

					// Calculate weighted score
					const weightedScore = 0.4 * normalizedGravity + 0.6 * normalizedMC

					return {
						...pool,
						weightedScore: weightedScore,
						isTopPool: false, // Will set this for the top pool later
					}
				})

				// Sort by weighted score
				poolsWithWeightedScore.sort((a, b) => b.weightedScore - a.weightedScore)

				// Mark the top pool
				if (poolsWithWeightedScore.length > 0) {
					poolsWithWeightedScore[0].isTopPool = true
				}

				setPools(poolsWithWeightedScore)
			} catch (err) {
				console.error('Error loading top gravity pools for ticker:', err)
				setPools([]) // Set empty array on error to prevent iteration errors
			} finally {
				setLoading(false)
			}
		}

		loadPools()
	}, [])

	// Obliczanie rzeczywistej szerokości elementów
	useEffect(() => {
		if (loading || pools.length === 0 || !tickerContentRef.current) return

		// Precyzyjne obliczanie szerokości po renderowaniu
		const calculateTotalWidth = () => {
			if (!tickerContentRef.current) return 0

			const items = tickerContentRef.current.querySelectorAll('.ticker-item')
			let width = 0

			// Obliczanie tylko dla pierwszego zestawu elementów
			const itemCount = Math.min(pools.length, items.length / 2)

			for (let i = 0; i < itemCount; i++) {
				if (items[i]) {
					const style = window.getComputedStyle(items[i])
					width += items[i].offsetWidth + parseInt(style.marginRight, 10) || 12
				}
			}

			return width > 0 ? width : window.innerWidth
		}

		// Opóźnienie dla pewności, że DOM jest zaktualizowany
		const timeoutId = setTimeout(() => {
			totalWidthRef.current = calculateTotalWidth()

			// Dodatkowe zabezpieczenie przed zbyt dużymi wartościami
			if (totalWidthRef.current > window.innerWidth * 5) {
				totalWidthRef.current = window.innerWidth * 2
			}
		}, 200)

		return () => clearTimeout(timeoutId)
	}, [loading, pools])

	// Set up the ticker animation with the fix for bounce-back
	useEffect(() => {
		if (loading || pools.length === 0 || !tickerContentRef.current || isPaused || !isVisible) return

		// Function to animate the ticker with improved reset logic
		const animate = () => {
			if (totalWidthRef.current <= 0) {
				animationRef.current = requestAnimationFrame(animate)
				return
			}

			// Update position
			let next = scrollPosRef.current - 0.4

			// Reset when reaching the end (bounce-back fix)
			if (next <= -totalWidthRef.current) {
				if (tickerContentRef.current) {
					tickerContentRef.current.style.transition = 'none'
					setTimeout(() => {
						if (tickerContentRef.current) {
							tickerContentRef.current.style.transition = 'transform 0.05s linear'
						}
					}, 20)
				}
				next = 0
			}

			scrollPosRef.current = next
			applyScrollTransform(next)

			animationRef.current = requestAnimationFrame(animate)
		}

		// Start animation
		animationRef.current = requestAnimationFrame(animate)

		// Cleanup
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current)
				animationRef.current = null
			}
		}
	}, [loading, pools, isPaused, isVisible])

	// Helper to update DOM transform without rerender
	const applyScrollTransform = (value) => {
		if (tickerContentRef.current) {
			tickerContentRef.current.style.transform = `translateX(${value}px)`
		}
	}

	const handleMouseEnter = () => {
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current)
			animationRef.current = null
		}
		setIsPaused(true)
	}

	const handleMouseLeave = () => {
		setIsPaused(false)
	}

	const handlePrevious = () => {
		const step = 200
		scrollPosRef.current = Math.min(scrollPosRef.current + step, 0)
		applyScrollTransform(scrollPosRef.current)
	}

	const handleNext = () => {
		const step = 200
		scrollPosRef.current = Math.max(scrollPosRef.current - step, -totalWidthRef.current)
		applyScrollTransform(scrollPosRef.current)
	}

	// Funkcja do przekierowania do strony szczegółów puli
	const handlePoolClick = (pool) => {
		navigate(`/pool/${pool.token_address}`)
	}

	// ---- add new useEffect for IntersectionObserver ----
	useEffect(() => {
		if (!tickerRef.current) return

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					setIsVisible(entry.isIntersecting)
				})
			},
			{
				root: null,
				threshold: 0,
			}
		)

		observer.observe(tickerRef.current)

		return () => {
			observer.disconnect()
		}
	}, [])
	// ---- end new IntersectionObserver effect ----

	if (loading || pools.length === 0) {
		return null // Don't show anything while loading
	}

	// Używamy dwóch kopii dla płynnego loopowania
	const duplicatedPools = [...pools, ...pools]

	return (
		<Stack spacing={2}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<h2 style={{ fontSize: '30px', fontWeight: '600' }}>Trending</h2>
				<SearchComponent />
			</div>

			<div
				className="ticker-container"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				// style={{ height: isSmallScreen ? '90px' : '100px' }}
			>
				{/* <div className="ticker-header">
					<div className="ticker-title">
          <Flame 
            size={16} 
            color={darkMode ? theme.accent.primary : "#FF71CD"}
            style={{ 
              marginRight: '6px',
              verticalAlign: 'middle',
              display: 'inline-block'
            }} 
          />
          <span style={{ 
            fontSize: '14px',
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Trending
          </span>
        </div>
					{isPaused && (
						<div className="ticker-nav-buttons">
							<button className="ticker-nav-button laser-border" onClick={handlePrevious}>
								<ChevronLeft size={16} />
							</button>
							<button className="ticker-nav-button laser-border" onClick={handleNext}>
								<ChevronRight size={16} />
							</button>
						</div>
					)}
				</div> */}
				<div
					className="ticker-wrapper"
					ref={tickerRef}
					style={{ height: isSmallScreen ? '60px' : '80px' }}
				>
					<div className="ticker-scroll" ref={tickerContentRef}>
						{duplicatedPools.map((pool, index) => (
							<TickerItem
								key={`${pool.id}-${index}`}
								pool={pool}
								theme={theme}
								darkMode={darkMode}
								isSmallScreen={isSmallScreen}
								onClick={() => handlePoolClick(pool)}
							/>
						))}
					</div>
				</div>
			</div>
		</Stack>
	)
}

const TickerItem = ({ pool, theme, darkMode, isSmallScreen, onClick }) => (
	<div
		className="ticker-item"
		onClick={onClick}
		style={{
			cursor: 'pointer',
			height: 'auto',
			padding: isSmallScreen ? '6px 12px' : '8px 14px',
			position: 'relative',
			// Specjalne podświetlenie dla najlepszej puli (King)
			// border: pool.isTopPool ? `2px solid ${darkMode ? theme.accent.primary : '#FF71CD'}` : 'none',
			border: `1px solid ${theme.border}`,
			boxShadow: 'none',
			background: theme.bg.card,
			transform: 'scale(1)',
			zIndex: pool.isTopPool ? 5 : 1,
			animation: 'none',
			overflow: 'hidden',
		}}
	>
		{/* Removed the shine effect div for king pools */}

		{pool.isTopPool && (
			<div
				style={{
					position: 'absolute',
					top: '0',
					right: '-15px',
					background: darkMode ? theme.accent.primary : theme.accent.secondary,
					color: 'white',
					fontWeight: 'bold',
					padding: '4px 16px',
					fontSize: isSmallScreen ? '10px' : '12px',
					transform: 'rotate(35deg)',
					transformOrigin: 'center',
					zIndex: 100,
					boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
					fontFamily: 'sans-serif',
					letterSpacing: '0.5px',
					whiteSpace: 'nowrap',
					width: 'fit-content',
					overflow: 'visible',
					display: 'flex',
					alignItems: 'center',
					gap: '4px',
				}}
			>
				KING
			</div>
		)}

		<img
			src={pool.image_url}
			alt={pool.name}
			// className={pool.isTopPool ? 'laser-glow' : 'laser-glow'}
			style={{
				width: isSmallScreen ? '32px' : '40px',
				height: isSmallScreen ? '32px' : '40px',
				marginRight: isSmallScreen ? '10px' : '12px',
				zIndex: 3,
				position: 'relative',
			}}
		/>

		<div className="ticker-item-content" style={{ position: 'relative', zIndex: 3 }}>
			<div className="ticker-item-title" style={{ display: 'flex', alignItems: 'center' }}>
				<span
					className="ticker-item-symbol"
					style={{
						color: theme.text.primary,
						fontSize: isSmallScreen ? '13px' : '15px',
					}}
				>
					{pool.symbol}
				</span>
				<img
					src={pool.isTopPool ? '/king.png' : '/crown.png'}
					alt={pool.isTopPool ? 'Top pool' : 'Pool'}
					style={{
						width: isSmallScreen ? '14px' : '16px',
						height: 'auto',
						marginLeft: '4px',
						opacity: pool.isTopPool ? 1 : 0.9,
						filter: pool.isTopPool ? 'none' : 'brightness(1.3) contrast(1.1)',
					}}
				/>
			</div>
			<div
				className="ticker-item-details"
				style={{
					display: 'flex',
					alignItems: 'center',
					flexWrap: 'nowrap',
					width: '100%',
					maxWidth: '100%',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
					}}
				>
					<span
						style={{
							color: theme.text.tertiary,
							fontSize: isSmallScreen ? '12px' : '14px',
							whiteSpace: 'nowrap',
						}}
					>
						mc: {pool.market_cap_formatted}
					</span>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							height: isSmallScreen ? '15px' : '18px',
							marginTop: '2px',
						}}
					>
						<span
							style={{
								color: theme.text.tertiary,
								fontSize: isSmallScreen ? '10px' : '14px',
							}}
						>
							Ø,G:
						</span>
						<div
							style={{
								position: 'relative',
								width: '60px',
								height: isSmallScreen ? '4px' : '5px',
								backgroundColor: darkMode ? '#2E2E3A' : '#e0e0e0',
								borderRadius: '2px',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									position: 'absolute',
									top: '0',
									left: '0',
									height: '100%',
									width: `${
										pool.gravity_score ? Math.min(Math.max(pool.gravity_score / 10, 0), 100) : 0
									}%`,
									backgroundColor: theme.accent.secondary,
									borderRadius: '2px',
									transition: 'width 0.3s ease-in-out',
								}}
							/>
						</div>
						<span
							style={{
								fontSize: isSmallScreen ? '10px' : '14px',
								fontWeight: '500',
								color: theme.text.tertiary,
							}}
						>
							{pool.gravity_score ? pool.gravity_score.toFixed(2) : '0.00'}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
)

export default PoolsTicker
