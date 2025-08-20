import { useTheme } from '../../context/ThemeContext'
import { useWallet } from '../../hooks/useWallet'

export const ConnectWalletAlert = () => {
	const { theme } = useTheme()
	const { connectWallet } = useWallet()
	return (
		<div
			style={{
				borderRadius: '16px',
				overflow: 'hidden',
				padding: '40px 24px',
				textAlign: 'center',
				maxWidth: '600px',
				margin: '0 auto',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					marginBottom: '24px',
				}}
			>
				<div
					style={{
						width: '120px',
						height: '120px',
						borderRadius: '50%',
						overflow: 'hidden',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<img
						src="/slop-img-logo.svg"
						alt="Connect Wallet"
						onError={(e) => (e.target.src = '/slop-img-logo.svg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							padding: '10px',
						}}
					/>
				</div>
			</div>

			<h2
				style={{
					fontSize: '24px',
					fontWeight: '600',
					color: theme.text.secondary,
					marginBottom: '16px',
				}}
			>
				Wallet Connection Required
			</h2>

			<p
				style={{
					color: theme.text.tertiary,
					marginBottom: '24px',
					fontSize: '16px',
					lineHeight: '1.5',
				}}
			>
				You need to connect your wallet to create a token. Access to token creation requires wallet
				authentication.
			</p>

			<button
				onClick={connectWallet}
				style={{
					background: theme.accent.secondary,
					color: 'white',
					border: 'none',
					borderRadius: '1000px',
					padding: '14px 32px',
					cursor: 'pointer',
					fontWeight: '600',
					fontSize: '16px',
					display: 'inline-flex',
					alignItems: 'center',
					gap: '8px',
				}}
			>
				Connect Wallet
			</button>
		</div>
	)
}
