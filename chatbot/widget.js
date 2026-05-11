(function () {
    // Configuration
    const API_URL = 'https://chat.kberkah88.my.id/chat';
    const PRIMARY_COLOR = '#128EEA'; // Requested Color

    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #chatbot-widget-container {
            position: fixed;
            bottom: 90px; /* Mobile: Higher to avoid bottom nav */
            right: 20px;  /* Mobile: Stay on right */
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Desktop: Move to Left & Reset Bottom */
        @media (min-width: 768px) {
            #chatbot-widget-container {
                bottom: 20px;
                left: 20px;
                right: auto;
            }
            
            /* Admin Theme: Move to Right */
            #chatbot-widget-container.admin-right {
                left: auto !important;
                right: 20px !important;
            }
        }
        #chatbot-toggle-btn {
            background-color: ${PRIMARY_COLOR};
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        #chatbot-toggle-btn:hover {
            transform: scale(1.1);
        }
        #chatbot-window {
            display: none;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 15px rgba(0,0,0,0.1);
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            margin-bottom: 16px;
        }
        #chatbot-header {
            background-color: ${PRIMARY_COLOR};
            color: white;
            padding: 16px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #chatbot-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background-color: #f9fafb;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        #chatbot-input-area {
            padding: 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
            background: white;
        }
        #chatbot-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            outline: none;
        }
        #chatbot-input:focus {
            border-color: ${PRIMARY_COLOR};
        }
        #chatbot-send-btn {
            background-color: ${PRIMARY_COLOR};
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
        }
        .message {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 12px;
            line-height: 1.4;
            font-size: 14px;
        }
        .message.user {
            align-self: flex-end;
            background-color: ${PRIMARY_COLOR};
            color: white;
            border-bottom-right-radius: 2px;
        }
        .message.bot {
            align-self: flex-start;
            background-color: #e5e7eb;
            color: #1f2937;
            border-bottom-left-radius: 2px;
        }
        .typing-indicator {
            font-style: italic;
            color: #6b7280;
            font-size: 12px;
            margin-left: 10px;
            display: none;
        }
    `;
    document.head.appendChild(style);

    // Create Container
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';

    // Chat Window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window';
    chatWindow.innerHTML = `
        <div id="chatbot-header">
            <span>Asisten AI</span>
            <span style="cursor:pointer" id="chatbot-close">✕</span>
        </div>
        <div id="chatbot-messages">
            <div class="message bot">Halo! Ada yang bisa saya bantu terkait website ini?</div>
        </div>
        <div class="typing-indicator" id="typing-indicator">Sedang mengetik...</div>
        <div id="chatbot-input-area">
            <input type="text" id="chatbot-input" placeholder="Ketik pesan..." />
            <button id="chatbot-send-btn">Kirim</button>
        </div>
    `;

    // Toggle Button
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'chatbot-toggle-btn';
    toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

    container.appendChild(chatWindow);
    container.appendChild(toggleBtn);
    document.body.appendChild(container);

    // Hide widget on /chatbot page
    // Hide widget on specific pages
    function updateWidgetVisibility() {
        const hiddenPaths = ['/chatbot', '/', '/berkah88', '/guest-checkout', '/transaksi', '/transaksi-manual', '/transaksi-sederhana', '/calculator'];
        if (hiddenPaths.includes(window.location.pathname)) {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
        }

        // Check theme for positioning
        const theme = localStorage.getItem('app-theme');
        if (theme === 'admin') {
            container.classList.add('admin-right');
        } else {
            container.classList.remove('admin-right');
        }
    }

    // Check on load
    updateWidgetVisibility();

    // Listen for route changes (for SPA)
    window.addEventListener('popstate', updateWidgetVisibility);

    // Also check periodically for hash-based routing and theme changes
    setInterval(updateWidgetVisibility, 500);

    // Event Listeners
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const messages = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    toggleBtn.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
    };

    document.getElementById('chatbot-close').onclick = () => {
        chatWindow.style.display = 'none';
    };

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // Add User Message
        appendMessage(text, 'user');
        input.value = '';
        typingIndicator.style.display = 'block';
        messages.scrollTop = messages.scrollHeight;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            typingIndicator.style.display = 'none';
            appendMessage(data.reply, 'bot');
        } catch (error) {
            typingIndicator.style.display = 'none';
            appendMessage("Maaf, terjadi kesalahan koneksi.", 'bot');
            console.error(error);
        }
    }

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

})();
