import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { BluetoothPrinter } = NativeModules;
const printerEvents = new NativeEventEmitter(BluetoothPrinter);

const LAST_PRINTER_ADDRESS = '@last_printer_address';

class BluetoothPrinterService {
  constructor() {
    this.connectionStatus = 'DISCONNECTED';
    this.reconnectTimer = null;
    printerEvents.addListener('onConnectionStatus', (status) => {
      console.log('Printer Status:', status);
      this.connectionStatus = status;

      if (status === 'DISCONNECTED') {
        this.startReconnectLogic();
      } else {
        this.stopReconnectLogic();
      }
    });
  }

  startReconnectLogic() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setInterval(async () => {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        await this.autoConnect();
      }
    }, 10000); // Coba setiap 10 detik
  }

  stopReconnectLogic() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  }

  async scanDevices() {
    if (!BluetoothPrinter) {
      console.warn('Native BluetoothPrinter module not found. Please build the app with native code.');
      return [];
    }
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) throw new Error('Izin Bluetooth ditolak');
      return await BluetoothPrinter.scan();
    } catch (error) {
      console.error('Scan Error:', error);
      throw error;
    }
  }

  async connect(address) {
    if (!BluetoothPrinter) {
      console.warn('Native BluetoothPrinter module not found.');
      return false;
    }
    try {
      const result = await BluetoothPrinter.connect(address);
      await AsyncStorage.setItem(LAST_PRINTER_ADDRESS, address);
      return result;
    } catch (error) {
      console.error('Connect Error:', error);
      throw error;
    }
  }

  async autoConnect() {
    if (!BluetoothPrinter) return;
    try {
      const lastAddress = await AsyncStorage.getItem(LAST_PRINTER_ADDRESS);
      if (lastAddress) {
        console.log('Mencoba auto-connect ke:', lastAddress);
        return await this.connect(lastAddress);
      }
    } catch (error) {
      console.log('Auto-connect gagal (abaikan jika printer mati)');
    }
  }

  /**
   * Helper untuk membuat teks 2 kolom (Kiri & Kanan)
   * Contoh: "Nasi Goreng      Rp 15.000"
   */
  formatColumns(left, right, width = 32) {
    const spaceCount = width - (left.toString().length + right.toString().length);
    if (spaceCount > 0) {
      return left + ' '.repeat(spaceCount) + right;
    }
    return left + ' ' + right;
  }

  async printText(text, options = {}) {
    return await this.printReceipt([{
      text,
      align: options.align || 'left',
      bold: options.bold || false,
      size: options.size || 'normal'
    }]);
  }

  async printReceipt(items) {
    if (!BluetoothPrinter) throw new Error('BluetoothPrinter Native Module not available. Need rebuild.');
    /**
     * items: Array<{ text: string, align: 'left'|'center'|'right', bold: boolean, size: 'normal'|'large' }>
     */
    try {
      return await BluetoothPrinter.printReceipt(items);
    } catch (error) {
      throw error;
    }
  }

  async printQR(content, size = 8) {
    if (!BluetoothPrinter) throw new Error('BluetoothPrinter Native Module not available.');
    try {
      return await BluetoothPrinter.printQRCode(content, size);
    } catch (error) {
      throw error;
    }
  }

  async cut() {
    if (!BluetoothPrinter) return;
    try {
      return await BluetoothPrinter.cutPaper();
    } catch (error) {
      throw error;
    }
  }

  async openCashDrawer() {
    if (!BluetoothPrinter) return;
    try {
      return await BluetoothPrinter.openCashDrawer();
    } catch (error) {
      throw error;
    }
  }

  async isConnected() {
    if (!BluetoothPrinter) return false;
    try {
      return await BluetoothPrinter.isConnected();
    } catch (error) {
      return false;
    }
  }
}

export default new BluetoothPrinterService();
