import '../../styles/gradient-border.css'
import '../../styles/ticker.css'

export const TickerItem = ({ pool, theme, darkMode, isSmallScreen, onClick }) => {
  return (
    <div
		className={`ticker-item ${darkMode ? 'gradient-ticker-border' : ''}`}
		onClick={onClick}
		style={{
			cursor: 'pointer',
			height: 'auto',
			padding: isSmallScreen ? '6px 12px' : '8px 14px',
			position: 'relative',
			border: `1px solid ${theme.border}`,
			boxShadow: 'none',
			background: theme.bg.card,
			transform: 'scale(1)',
			zIndex: pool.isTopPool ? 5 : 1,
			animation: 'none',
			overflow: 'hidden',
		}}
	>
		{darkMode && (
			<img
				src="/sticker-item.png"
				alt="sticker-item"
				style={{
					position: 'absolute',
					top: '0',
					right: '0',
					width: '25%',
					height: '40%',
					borderRadius: 0,
					objectFit: 'contain',
					margin: 0,
				}}
			/>
		)}

		<img
			// src={pool.image_url}
			src="/slop-avatar.png"
			alt={pool.name}
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
						flex: 1,
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
							lineHeight: 1.2,
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
								width: '100%',
								height: isSmallScreen ? '4px' : '5px',
								backgroundColor: darkMode ? '#0F0F0F' : '#FCF2FC',
								borderRadius: '2px',
								overflow: 'hidden',
								flex: 1,
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
}