import { AlertTriangle, Check } from 'lucide-react'
import React from 'react'
import TransactionOverlay from '../components/TokenCreation/TransactionOverlay'
import { useNavigate } from '../context/NavigationContext'
import { useTheme } from '../context/ThemeContext'
import useCreateToken from '../hooks/useCreateToken'
import useNSFWDetection from '../hooks/useNSFWDetection'
import { useWallet } from '../hooks/useWallet'
import CreateTokenForm from './CreateTokenForm'
import { ConnectWalletAlert } from '../components/ui/ConnectWalletAlert'

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
		handleChange,
		handleImageChange: baseHandleImageChange,
		handleSubmit: baseHandleSubmit,
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
					<ConnectWalletAlert />
				) : (
					<>
						<style jsx="true">{`
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
