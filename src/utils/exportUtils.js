export const prepareTransactionDataForExport = (transactions) => {
  return transactions.map(t => ({
    'ID Transaksi': t.id,
    'Tanggal': new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }).format(new Date(t.timestamp)),
    'Item': t.items.map(item => `${item.name} (${item.quantity})`).join('; '),
    'Total': parseFloat(t.total || 0),
    'Jenis': t.isEmployeeMeal ? 'Makan Karyawan' : 'Regular'
  }));
};
