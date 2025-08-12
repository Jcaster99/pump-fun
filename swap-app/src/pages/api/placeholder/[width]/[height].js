export default function handler(req, res) {
  const { width, height } = req.query;
  
  // Losowy kolor tła dla tokenu
  const colors = [
    '00D2E9', // primary accent
    'FF5CAA', // secondary accent
    '6D28D9', // purple
    '2563EB', // blue
    'F59E0B', // amber
  ];
  
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Przekieruj do placeholderowego serwisu
  res.redirect(`https://placehold.co/${width}x${height}/${randomColor}/FFFFFF?text=TOKEN`);
} 