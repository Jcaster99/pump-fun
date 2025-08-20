import { Stack } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { fetchTopGravityPools } from '../../api/poolsApi'
import { useNavigate } from '../../context/NavigationContext'
import { useTheme } from '../../context/ThemeContext'
import '../../styles/leaderboard.css'
import '../../styles/gradient-border.css'
import '../../styles/ticker.css'
import { SearchComponent } from '../common/SearchComponent'
import { TickerItem } from '../ui/TickerItem'

export const PoolsTicker = () => {
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
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
				<h2 style={{ fontSize: '30px', fontWeight: '600' }}>Trending</h2>
				<SearchComponent />
			</div>

			<div
				className="ticker-container"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
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
