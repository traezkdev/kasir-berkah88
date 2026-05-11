package com.traezkdev.kasirberkah88mobile.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.IOException
import java.io.OutputStream
import java.util.*

@SuppressLint("MissingPermission")
class BluetoothPrinterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        (reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    }
    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var connectedDevice: BluetoothDevice? = null
    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    // ESC/POS Commands
    private val ESC: Byte = 0x1B
    private val GS: Byte = 0x1D
    private val LINE_FEED: Byte = 0x0A
    private val CMD_INIT = byteArrayOf(ESC, 0x40.toByte()) // Initialize printer
    private val CMD_ALIGN_LEFT = byteArrayOf(ESC, 0x61.toByte(), 0x00.toByte())
    private val CMD_ALIGN_CENTER = byteArrayOf(ESC, 0x61.toByte(), 0x01.toByte())
    private val CMD_ALIGN_RIGHT = byteArrayOf(ESC, 0x61.toByte(), 0x02.toByte())
    private val CMD_BOLD_ON = byteArrayOf(ESC, 0x45.toByte(), 0x01.toByte())
    private val CMD_BOLD_OFF = byteArrayOf(ESC, 0x45.toByte(), 0x00.toByte())
    private val CMD_FONT_NORMAL = byteArrayOf(ESC, 0x21.toByte(), 0x00.toByte())
    private val CMD_FONT_LARGE = byteArrayOf(ESC, 0x21.toByte(), 0x30.toByte()) // Double height & width
    private val CMD_CUT = byteArrayOf(GS, 0x56.toByte(), 0x42.toByte(), 0x00.toByte())

    override fun getName(): String = "BluetoothPrinter"

    @ReactMethod
    fun scan(promise: Promise) {
        if (bluetoothAdapter == null) {
            promise.reject("ERR_NO_BT", "Bluetooth tidak didukung di perangkat ini")
            return
        }
        if (!bluetoothAdapter!!.isEnabled) {
            promise.reject("ERR_BT_OFF", "Bluetooth mati, silakan nyalakan terlebih dahulu")
            return
        }

        val deviceList = Arguments.createArray()
        val pairedDevices = bluetoothAdapter!!.bondedDevices
        for (device in pairedDevices) {
            val deviceMap = Arguments.createMap()
            deviceMap.putString("name", device.name ?: "Unknown Device")
            deviceMap.putString("address", device.address)
            deviceList.pushMap(deviceMap)
        }
        promise.resolve(deviceList)
    }

    @ReactMethod
    fun connect(address: String, promise: Promise) {
        if (connectedDevice?.address == address && bluetoothSocket?.isConnected == true) {
            promise.resolve("Sudah terhubung")
            return
        }

        Thread {
            try {
                val device = bluetoothAdapter?.getRemoteDevice(address)
                if (device == null) {
                    promise.reject("ERR_DEVICE", "Perangkat tidak ditemukan")
                    return@Thread
                }

                // Close existing if any
                disconnectSync()

                bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                bluetoothSocket?.connect()
                outputStream = bluetoothSocket?.outputStream
                connectedDevice = device
                
                promise.resolve("Berhasil terhubung ke ${device.name}")
                sendEvent("onConnectionStatus", "CONNECTED")
            } catch (e: Exception) {
                promise.reject("ERR_CONNECT", "Gagal menyambung: ${e.message}")
                sendEvent("onConnectionStatus", "DISCONNECTED")
            }
        }.start()
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            disconnectSync()
            promise.resolve("Terputus")
        } catch (e: Exception) {
            promise.reject("ERR_DISCONNECT", e.message)
        }
    }

    private fun disconnectSync() {
        try {
            outputStream?.close()
            bluetoothSocket?.close()
            outputStream = null
            bluetoothSocket = null
            connectedDevice = null
            sendEvent("onConnectionStatus", "DISCONNECTED")
        } catch (e: IOException) {}
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        promise.resolve(bluetoothSocket?.isConnected == true)
    }

    @ReactMethod
    fun printReceipt(data: ReadableArray, promise: Promise) {
        if (outputStream == null) {
            promise.reject("ERR_NOT_CONNECTED", "Printer tidak terhubung")
            return
        }

        Thread {
            try {
                outputStream!!.write(CMD_INIT)
                
                for (i in 0 until data.size()) {
                    val item = data.getMap(i) ?: continue
                    val text = item.getString("text") ?: ""
                    val align = item.getString("align") ?: "left"
                    val bold = if (item.hasKey("bold")) item.getBoolean("bold") else false
                    val size = item.getString("size") ?: "normal"

                    // Set Alignment
                    when (align) {
                        "center" -> outputStream!!.write(CMD_ALIGN_CENTER)
                        "right" -> outputStream!!.write(CMD_ALIGN_RIGHT)
                        else -> outputStream!!.write(CMD_ALIGN_LEFT)
                    }

                    // Set Bold
                    outputStream!!.write(if (bold) CMD_BOLD_ON else CMD_BOLD_OFF)

                    // Set Font Size
                    outputStream!!.write(if (size == "large") CMD_FONT_LARGE else CMD_FONT_NORMAL)

                    // Write Text
                    outputStream!!.write(text.toByteArray(Charsets.UTF_8))
                    outputStream!!.write(byteArrayOf(LINE_FEED))
                }

                // Feed some space
                outputStream!!.write(byteArrayOf(LINE_FEED, LINE_FEED, LINE_FEED))
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("ERR_PRINT", "Gagal mencetak: ${e.message}")
            }
        }.start()
    }

    @ReactMethod
    fun printQRCode(content: String, size: Int, promise: Promise) {
        if (outputStream == null) {
            promise.reject("ERR_NOT_CONNECTED", "Printer tidak terhubung")
            return
        }

        Thread {
            try {
                // ESC/POS QR Code standard
                val bytes = content.toByteArray(Charsets.UTF_8)
                val pL = (bytes.size + 3) % 256
                val pH = (bytes.size + 3) / 256

                // 1. Select alignment (Center)
                outputStream!!.write(CMD_ALIGN_CENTER)

                // 2. Set QR Model (Model 2)
                outputStream!!.write(byteArrayOf(GS, 0x28.toByte(), 0x6B.toByte(), 0x04.toByte(), 0x00.toByte(), 0x31.toByte(), 0x41.toByte(), 0x32.toByte(), 0x00.toByte()))

                // 3. Set QR Size
                val sizeByte = if (size in 1..16) size.toByte() else 8.toByte()
                outputStream!!.write(byteArrayOf(GS, 0x28.toByte(), 0x6B.toByte(), 0x03.toByte(), 0x00.toByte(), 0x31.toByte(), 0x43.toByte(), sizeByte))

                // 4. Set QR Error Correction (Level L)
                outputStream!!.write(byteArrayOf(GS, 0x28.toByte(), 0x6B.toByte(), 0x03.toByte(), 0x00.toByte(), 0x31.toByte(), 0x45.toByte(), 0x30.toByte()))

                // 5. Store QR Data
                outputStream!!.write(byteArrayOf(GS, 0x28.toByte(), 0x6B.toByte(), pL.toByte(), pH.toByte(), 0x31.toByte(), 0x50.toByte(), 0x30.toByte()))
                outputStream!!.write(bytes)

                // 6. Print QR Code
                outputStream!!.write(byteArrayOf(GS, 0x28.toByte(), 0x6B.toByte(), 0x03.toByte(), 0x00.toByte(), 0x31.toByte(), 0x51.toByte(), 0x30.toByte()))

                outputStream!!.write(byteArrayOf(LINE_FEED, LINE_FEED))
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("ERR_QR", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun cutPaper(promise: Promise) {
        try {
            outputStream?.write(CMD_CUT)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_CUT", e.message)
        }
    }

    private fun sendEvent(eventName: String, params: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
