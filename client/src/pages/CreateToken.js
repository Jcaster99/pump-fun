import { AlertTriangle, Check } from 'lucide-react'
import React from 'react'
import TransactionOverlay from '../components/TokenCreation/TransactionOverlay'
import { useNavigate } from '../context/NavigationContext'
import { useTheme } from '../context/ThemeContext'
import useCreateToken from '../hooks/useCreateToken'
import useNSFWDetection from '../hooks/useNSFWDetection'
import { useWallet } from '../hooks/useWallet'
import CreateTokenForm from './CreateTokenForm'

// Pobieramy wartości z zmiennych środowiskowych
const TREASURY_ADDRESS =
	process.env.REACT_APP_TREASURY_ADDRESS || '0x0f13e85B575964B8b4b77E37d43A6aE9E354e94C'
const LISTING_FEE = process.env.REACT_APP_LISTING_FEE || '0.015' // Fallback wartość w razie braku zmiennej

const CreateToken = () => {
	const { theme, darkMode } = useTheme()
	const { wallet, connectWallet, username } = useWallet()
	const navigate = useNavigate()

	// Use NSFW detection hook
	const { checking, handleImageValidation } = useNSFWDetection()

	// Use token creation hook
	const {
		formData,
		image,
		imagePreview,
		loading,
		error,
		success,
		formErrors,
		transactionStep,
		formVisible,
		handleChange,
		handleImageChange: baseHandleImageChange,
		handleSubmit: baseHandleSubmit,
		showForm,
	} = useCreateToken(wallet, connectWallet, navigate, username)

	// Wrapper for image change to integrate with NSFW detection
	const handleImageChange = (e) => {
		baseHandleImageChange(e, handleImageValidation)
	}

	// Wrapper for submit to provide constants
	const handleSubmit = (e) => {
		baseHandleSubmit(e, TREASURY_ADDRESS, LISTING_FEE)
	}

	return (
		<div
			style={{
				minHeight: '100vh',
				// paddingTop: '72px', // For fixed header
				paddingBottom: '32px',
				position: 'relative',
				overflowX: 'hidden',
			}}
		>
			{/* Transaction Progress Overlay */}
			<TransactionOverlay
				transactionStep={transactionStep}
				theme={theme}
				darkMode={darkMode}
				LISTING_FEE={LISTING_FEE}
			/>

			<div
				style={{
					maxWidth: '800px',
					margin: '0 auto',
					padding: '0 16px',
					position: 'relative',
					zIndex: 2,
				}}
			>
				{!wallet ? (
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
							You need to connect your wallet to create a token. Access to token creation requires
							wallet authentication.
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
				) : (
					<>
						<style jsx="true">{`
							@keyframes pulse {
								0% {
									box-shadow: 0 0 0 0
										${darkMode ? 'rgba(0, 210, 233, 0.6)' : 'rgba(255, 92, 170, 0.6)'};
								}
								70% {
									box-shadow: 0 0 0 15px
										${darkMode ? 'rgba(0, 210, 233, 0)' : 'rgba(255, 92, 170, 0)'};
								}
								100% {
									box-shadow: 0 0 0 0 ${darkMode ? 'rgba(0, 210, 233, 0)' : 'rgba(255, 92, 170, 0)'};
								}
							}

							@keyframes bounceArrow {
								0%,
								100% {
									transform: translateY(0);
								}
								50% {
									transform: translateY(10px);
								}
							}

							@keyframes fadeIn {
								from {
									opacity: 0;
									transform: translateY(-10px);
								}
								to {
									opacity: 1;
									transform: translateY(0);
								}
							}
						`}</style>

						{error && (
							<div
								style={{
									padding: '12px 16px',
									backgroundColor: 'rgba(255, 87, 87, 0.1)',
									borderRadius: '8px',
									marginBottom: '24px',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '12px',
								}}
							>
								<AlertTriangle size={20} color="#FF5757" style={{ marginTop: '2px' }} />
								<p style={{ color: '#FF5757', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>
									{error}
								</p>
							</div>
						)}

						{success && (
							<div
								style={{
									padding: '12px 16px',
									backgroundColor: 'rgba(52, 211, 153, 0.1)',
									borderRadius: '8px',
									marginBottom: '24px',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '12px',
								}}
							>
								<Check size={20} color="#34D399" style={{ marginTop: '2px' }} />
								<p style={{ color: '#34D399', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>
									{success}
								</p>
							</div>
						)}

						<CreateTokenForm
							formData={formData}
							formErrors={formErrors}
							image={image}
							imagePreview={imagePreview}
							loading={loading}
							checking={checking}
							handleChange={handleChange}
							handleImageChange={handleImageChange}
							handleSubmit={handleSubmit}
							theme={theme}
							darkMode={darkMode}
							connectWallet={connectWallet}
							wallet={wallet}
							LISTING_FEE={LISTING_FEE}
							id="token-form"
						/>
					</>
				)}
			</div>
		</div>
	)
}

export default CreateToken
