import React, { useState, useEffect, useRef, useMemo } from 'react'
import { TrendingUp, ChevronDown, ArrowUp, ArrowDown, Flame } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { usePools } from '../../context/PoolContext'
import PoolCard from './PoolCard'
import Pagination from '../Pagination'

const sortOptions = [
	{ value: 'gravity_score', label: 'gravity score', icon: '🌟' },
	{ value: 'created_at', label: 'creation time', icon: '⏱️' },
	{ value: 'market_cap', label: 'market cap', icon: '💰' },
	{ value: 'change_24h', label: 'pumping', icon: '📈' },
	{ value: 'bonding_curve_percentage', label: 'progress to graduation', icon: '🎓' },
]

// Create media query style
const getGridColumns = () => {
	const width = window.innerWidth
	if (width < 768) {
		return 'repeat(1, 1fr)' // Mobile - 1 column
	} else if (width < 1024) {
		return 'repeat(2, 1fr)' // Tablets - 2 columns
	} else if (width < 1280) {
		return 'repeat(3, 1fr)' // Small desktops - 3 columns
	} else {
		return 'repeat(4, 1fr)' // Medium and large desktops - 4 columns
	}
}

const TrendingPools = () => {
	const { darkMode, theme } = useTheme()
	const { pools, loading, error, recentlyAddedPoolId, sortBy, changeSorting } = usePools()
	const [showSortMenu, setShowSortMenu] = useState(false)
	const [showSortMenuBelow, setShowSortMenuBelow] = useState(false)
	const [gridColumns, setGridColumns] = useState(getGridColumns())
	const sortMenuRef = useRef(null)
	const sortMenuBelowRef = useRef(null)

	// Paginacja
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage] = useState(30)

	const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary

	// Oblicz całkowitą liczbę stron
	const totalPages = useMemo(() => {
		return Math.ceil((pools?.length || 0) / itemsPerPage)
	}, [pools, itemsPerPage])

	// Pobierz tylko poolsy dla aktualnej strony
	const paginatedPools = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		return pools.slice(startIndex, endIndex)
	}, [pools, currentPage, itemsPerPage])

	// Adjust layout to screen width
	useEffect(() => {
		const handleResize = () => {
			setGridColumns(getGridColumns())
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Handle clicks outside the sort menus to close them
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
				setShowSortMenu(false)
			}
			if (sortMenuBelowRef.current && !sortMenuBelowRef.current.contains(event.target)) {
				setShowSortMenuBelow(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Resetuj paginację przy zmianie sortowania
	useEffect(() => {
		setCurrentPage(1)
	}, [sortBy])

	// Find current sort option
	const currentSortOption = sortOptions.find((option) => option.value === sortBy) || sortOptions[0]

	// Handle page change
	const handlePageChange = (newPage) => {
		setCurrentPage(newPage)
	}

	// Handle sort change
	const handleSortChange = (newSortBy) => {
		changeSorting(newSortBy, 'DESC')
		setShowSortMenu(false)
		setShowSortMenuBelow(false)
	}

	// Create dropdown menu component to reuse
	const renderSortMenu = (isVisible, position) => {
		if (!isVisible) return null

		return (
			<div
				style={{
					position: 'absolute',
					top: position === 'below' ? 'calc(100% + 2px)' : '100%',
					left: position === 'below' ? '0' : null,
					right: position === 'below' ? null : '0',
					backgroundColor: theme.bg.card,
					border: `1px solid ${theme.border}`,
					borderRadius: '4px',
					width: '186px',
					zIndex: 10,
					marginTop: '4px',
					// boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
					overflow: 'hidden',
				}}
			>
				{sortOptions.map((option) => (
					<div
						key={option.value}
						onClick={() => handleSortChange(option.value)}
						style={{
							padding: '8px 12px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							backgroundColor:
								sortBy === option.value ? (darkMode ? '#303040' : '#f0f0f5') : 'transparent',
							color: sortBy === option.value ? accentColor : theme.text.primary,
							borderLeft:
								sortBy === option.value ? `3px solid ${accentColor}` : '3px solid transparent',
							transition: 'all 0.15s ease',
							textTransform: 'capitalize',
						}}
					>
						{sortBy === option.value ? (
							<span style={{ marginRight: '8px', color: accentColor }}>✓</span>
						) : (
							<span style={{ marginRight: '8px', opacity: 0 }}>✓</span>
						)}
						<span style={{ fontSize: '14px' }}>{option.label}</span>
						{/* <span style={{ marginLeft: 'auto' }}>{option.icon}</span> */}
					</div>
				))}
			</div>
		)
	}

	return (
		<div style={{ margin: '32px 0' }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: '20px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					{/* {sortBy === 'change_24h' ? (
						<ArrowUp size={20} color="#5FE388" /> // Green arrow for pumping
					) : (
						<TrendingUp size={20} color={accentColor} />
					)} */}
					<h2
						style={{
							fontSize: '30px',
							fontWeight: '600',
						}}
					>
						{currentSortOption.label.charAt(0).toUpperCase() + currentSortOption.label.slice(1)}
					</h2>
				</div>

				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-start',
						position: 'relative',
					}}
					ref={sortMenuBelowRef}
				>
					<button
						onClick={() => {
							setShowSortMenuBelow(!showSortMenuBelow)
							setShowSortMenu(false)
						}}
						style={{
							height: '44px',
							backgroundColor: darkMode ? '#050505' : '#ffffff',
							color: theme.text.tertiary,
							border: `1px solid ${darkMode ? "#141414" : '#F5F5F5'}`,
							borderRadius: '1000px',
							padding: '10px 16px',
							fontSize: '16px',
							fontWeight: '500',
							display: 'flex',
							alignItems: 'center',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							textTransform: 'capitalize',
						}}
					>
						{/* {sortBy === 'change_24h' ? (
							<ArrowUp size={16} color="#5FE388" style={{ marginRight: '8px' }} />
						) : (
							<Flame size={16} color={accentColor} style={{ marginRight: '8px' }} />
						)} */}
						<span style={{ marginRight: '6px' }}>Sort: {currentSortOption.label}</span>
						{/* <span style={{ marginRight: '6px' }}>{currentSortOption.icon}</span> */}
						<ChevronDown size={14} color={showSortMenuBelow ? accentColor : theme.text.secondary} />
					</button>

					{renderSortMenu(showSortMenuBelow, 'below')}
				</div>
			</div>

			{/* Sort button below heading */}

			{loading ? (
				<div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
					Loading newest tokens...
				</div>
			) : error ? (
				<div style={{ padding: '20px', textAlign: 'center', color: '#FF5757' }}>{error}</div>
			) : (
				<>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: gridColumns,
							gap: '16px',
							width: '100%',
						}}
					>
						{paginatedPools.map((pool) => (
							<PoolCard
								key={`pool-${pool.id}-${pool.token_address || ''}`}
								pool={pool}
								theme={theme}
								darkMode={darkMode}
								isNew={pool.id === recentlyAddedPoolId}
							/>
						))}
					</div>

					{/* Add Pagination component */}
					{totalPages > 1 && (
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={handlePageChange}
							theme={theme}
						/>
					)}
				</>
			)}
		</div>
	)
}

export default TrendingPools
