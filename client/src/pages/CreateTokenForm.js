import React, { useEffect, useState } from 'react'
import {
	SocialMediaSection,
	SubmitSection,
	TokenDetailsSection,
	TokenImageSection,
	WalletNotConnectedView,
} from './CreateTokenFormSections'

const CreateTokenForm = ({
	formData,
	formErrors,
	image,
	imagePreview,
	loading,
	checking,
	handleChange,
	handleImageChange,
	handleSubmit,
	theme,
	darkMode,
	connectWallet,
	wallet,
	LISTING_FEE,
	id,
}) => {
	// Responsive state
	const [isMobile, setIsMobile] = useState(false)

	// Check if the device is mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768)
		}

		// Initial check
		checkMobile()

		// Add event listener
		window.addEventListener('resize', checkMobile)

		// Clean up
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	// Style components - modernized with more pronounced effects
	const inputStyle = {
		backgroundColor: theme.bg.card,
		border: `1px solid ${theme.border}`,
		borderRadius: '8px',
		color: theme.text.primary,
		padding: '0 18px',
		height: '56px',
		width: '100%',
		fontSize: '15px',
		marginBottom: '4px',
		transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
		outline: 'none',
		backdropFilter: 'blur(10px)',
		caretColor: 'transparent',
	}

	const errorInputStyle = {
		...inputStyle,
		borderColor: '#FF5757',
		backgroundColor: darkMode ? 'rgba(255, 60, 60, 0.08)' : 'rgba(255, 60, 60, 0.03)',
		boxShadow: '0 0 0 1px rgba(255, 87, 87, 0.2)',
	}

	const disabledInputStyle = {
		...inputStyle,
		backgroundColor: darkMode ? 'rgba(15, 20, 30, 0.4)' : 'rgba(240, 240, 245, 0.5)',
		color: theme.text.secondary,
		cursor: 'not-allowed',
	}

	// Stan do śledzenia aktywnego pola i pozycji kursora
	const [activeField, setActiveField] = useState(null)
	const [caretPosition, setCaretPosition] = useState({ left: 0, top: 0 })

	// Function to clear the image
	const clearImage = () => {
		// We simulate a file input change with an empty array
		handleImageChange({ target: { files: [] } })
	}

	// Funkcja do ustawiania karetki GIF
	const handleFocusWithCaret = (e, fieldName) => {
		setActiveField(fieldName)

		// Standardowe zachowanie onFocus
		e.target.style.boxShadow = darkMode
			? `0 0 0 2px rgba(${theme.accent.secondary.replace('rgb(', '').replace(')', '')}, 0.3)`
			: `0 0 0 2px rgba(${theme.accent.secondary.replace('rgb(', '').replace(')', '')}, 0.3)`
		e.target.style.borderColor = theme.accent.secondary
		e.target.style.transform = 'translateY(-1px)'

		// Śledzenie pozycji kursora przy każdym kliknięciu i wprowadzaniu tekstu
		updateCaretPosition(e)
	}

	const handleBlurWithCaret = (e, fieldName) => {
		setActiveField(null)

		// Standardowe zachowanie onBlur
		e.target.style.boxShadow = darkMode ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.03)'
		e.target.style.transform = 'translateY(0)'
		if (!formErrors[fieldName]) {
			e.target.style.borderColor = darkMode ? 'rgba(60, 75, 95, 0.25)' : 'rgba(220, 230, 245, 0.9)'
		}
	}

	const updateCaretPosition = (e) => {
		if (!e.target) return

		try {
			// Pobranie pozycji kursora
			const cursorPosition = e.target.selectionStart
			const value = e.target.value.substring(0, cursorPosition)

			// Tworzenie tymczasowego elementu do zmierzenia tekstu
			const tempElement = document.createElement('span')
			tempElement.style.font = getComputedStyle(e.target).font
			tempElement.style.visibility = 'hidden'
			tempElement.style.position = 'absolute'
			tempElement.style.whiteSpace = 'pre'
			tempElement.textContent = value || ''

			document.body.appendChild(tempElement)
			const textWidth = tempElement.getBoundingClientRect().width
			document.body.removeChild(tempElement)

			// Obliczanie pozycji
			const inputRect = e.target.getBoundingClientRect()
			const inputPadding = parseInt(getComputedStyle(e.target).paddingLeft)

			let left = textWidth + inputPadding
			const top = inputRect.height / 2

			// Upewnienie się, że karetka nie wychodzi poza pole
			if (left > inputRect.width - inputPadding) {
				left = inputRect.width - inputPadding
			}

			setCaretPosition({ left, top })
		} catch (err) {
			console.error('Błąd przy ustawianiu pozycji kursora:', err)
		}
	}

	// Event handler dla kliknięcia i zmiany tekstu
	const handleInputEvent = (e) => {
		handleChange(e)
		if (activeField) {
			updateCaretPosition(e)
		}
	}

	// Get the appropriate style for an input based on validation state
	const getInputStyle = (fieldName) => {
		if (formErrors[fieldName]) {
			return errorInputStyle
		}
		if (loading) {
			return disabledInputStyle
		}
		return inputStyle
	}

	// Button gradient style matching the wallet button
	const buttonStyle = {
		background: theme.accent.secondary,
		color: '#fff',
		border: 'none',
		borderRadius: '1000px',
		padding: '10px 16px',
		fontSize: '16px',
		fontWeight: '500',
		cursor: loading || checking ? 'not-allowed' : 'pointer',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '10px',
		transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
		letterSpacing: '0.5px',
	}

	const disabledButtonStyle = {
		...buttonStyle,
		background: darkMode ? 'rgba(30, 35, 45, 0.5)' : 'rgba(150, 150, 150, 0.2)',
		cursor: 'not-allowed',
		boxShadow: 'none',
	}

	// Section style for grouping form elements
	const sectionStyle = {
		marginBottom: '32px',
		backgroundColor: theme.bg.card,
		transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
		width: '100%',
	}

	// Label style for form inputs
	const labelStyle = {
		display: 'block',
		marginBottom: '8px',
		color: theme.text.secondary,
		fontSize: '14px',
		fontWeight: '400',
		letterSpacing: '0.5px',
		textTransform: 'capitalize',
	}

	// Heading style for sections
	const headingStyle = {
		fontSize: '20px',
		fontWeight: '700',
		color: theme.text.primary,
		marginBottom: '20px',
		display: 'flex',
		alignItems: 'center',
		gap: '14px',
		position: 'relative',
	}

	if (!wallet) {
		return (
			<WalletNotConnectedView connectWallet={connectWallet} theme={theme} darkMode={darkMode} />
		)
	}

	// Connected wallet form view
	return (
		<div>
			<div style={{ marginBottom: 32, lineHeight: 1.2 }}>
				<h1 style={{ fontSize: 30, color: theme.text.primary, textTransform: 'capitalize' }}>
					Create token
				</h1>
				<p style={{ fontSize: 18, fontWeight: 400, color: theme.text.secondary, marginTop: 4 }}>
					Bring your best idea on-chain (or the most retarded)
				</p>
			</div>

			<div
				id={id}
				style={{
					backgroundColor: theme.bg.card,
					border: `1px solid ${theme.border}`,
					borderRadius: '24px',
					overflow: 'hidden',
					padding: isMobile ? '30px 20px' : '32px',
					backdropFilter: 'blur(18px)',
					transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
					maxWidth: '100%',
					width: isMobile ? '100%' : 'auto',
					margin: '0 auto',
				}}
			>
				{/* Dodanie globalnego stylu dla GIF kursora i responsywności */}
				<style jsx="true">{`
					.input-container {
						position: relative;
					}

					.custom-caret {
						position: absolute;
						pointer-events: none;
						width: 30px;
						height: 30px;
						background-image: url('/foot.gif');
						background-size: contain;
						background-repeat: no-repeat;
						background-position: center;
						z-index: 5;
						transform: translateY(-50%);
						filter: drop-shadow(0 0 4px rgba(0, 210, 233, 0.4));
						animation: pulse-subtle 1.5s infinite ease-in-out;
					}

					@keyframes pulse-subtle {
						0% {
							transform: translateY(-50%) scale(0.95);
						}
						50% {
							transform: translateY(-50%) scale(1.05);
						}
						100% {
							transform: translateY(-50%) scale(0.95);
						}
					}

					.form-section {
						transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
					}
					/*
					.form-section:hover {
						transform: translateY(-2px);
						box-shadow: ${darkMode
						? '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
						: '0 10px 30px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.7)'};
					}
					*/
					/* Responsive styles */
					@media (max-width: 768px) {
						input,
						textarea {
							font-size: 16px !important; /* Prevent zoom on input focus on iOS */
						}

						h3 {
							font-size: 18px !important;
						}

						.form-section {
							margin-bottom: 20px !important;
						}
					}
				`}</style>

				<form onSubmit={handleSubmit} style={{ width: '100%' }}>
					<TokenImageSection
						image={image}
						imagePreview={imagePreview}
						loading={loading}
						checking={checking}
						handleImageChange={handleImageChange}
						clearImage={clearImage}
						formErrors={formErrors}
						sectionStyle={sectionStyle}
						headingStyle={headingStyle}
						theme={theme}
						darkMode={darkMode}
					/>

					<TokenDetailsSection
						formData={formData}
						formErrors={formErrors}
						loading={loading}
						activeField={activeField}
						caretPosition={caretPosition}
						handleInputEvent={handleInputEvent}
						handleFocusWithCaret={handleFocusWithCaret}
						handleBlurWithCaret={handleBlurWithCaret}
						getInputStyle={getInputStyle}
						headingStyle={headingStyle}
						sectionStyle={sectionStyle}
						labelStyle={labelStyle}
						theme={theme}
						darkMode={darkMode}
					/>

					<SocialMediaSection
						formData={formData}
						formErrors={formErrors}
						loading={loading}
						activeField={activeField}
						caretPosition={caretPosition}
						handleInputEvent={handleInputEvent}
						handleFocusWithCaret={handleFocusWithCaret}
						handleBlurWithCaret={handleBlurWithCaret}
						getInputStyle={getInputStyle}
						headingStyle={headingStyle}
						sectionStyle={sectionStyle}
						labelStyle={labelStyle}
						theme={theme}
						darkMode={darkMode}
					/>

					<SubmitSection
						loading={loading}
						wallet={wallet}
						LISTING_FEE={LISTING_FEE}
						buttonStyle={buttonStyle}
						disabledButtonStyle={disabledButtonStyle}
						darkMode={darkMode}
						theme={theme}
					/>
				</form>
			</div>
		</div>
	)
}

export default CreateTokenForm
