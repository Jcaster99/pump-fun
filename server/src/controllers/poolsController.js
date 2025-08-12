const createPool = async (req, res) => {
  try {
    // ... istniejąca logika tworzenia poola ...
    
    // Zakładam, że mamy tutaj dane o nowym poolu w zmiennej 'newPool'
    const newPool = {
      token_address: pool.token_address,
      symbol: pool.symbol,
      name: pool.name,
      creator_address: req.wallet_address, // adres twórcy
      username: req.username // opcjonalna nazwa użytkownika
    };
    
    // Wyślij powiadomienie za pomocą API broadcast service
    try {
      await axios.post(`${process.env.TRANSACTION_WS_URL || 'http://localhost:3005'}/api/broadcast-pool`, newPool);
    } catch (error) {
      console.error('Failed to broadcast new pool creation:', error.message);
      // Nie przerywamy głównej operacji w przypadku błędu broadcastu
    }
    
    // ... reszta istniejącej logiki ...
    
    return res.status(201).json({ success: true, pool: newPool });
  } catch (error) {
    console.error('Error creating pool:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}; 