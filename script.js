document.addEventListener('DOMContentLoaded', () => {
    const work = document.getElementById('work');
    const anim = document.getElementById('anim');
    const playBtn = document.getElementById('playBtn');
    const closeBtn = document.getElementById('closeBtn');
    const actionBtn = document.getElementById('actionBtn');
    const msgLog = document.getElementById('messagesLog');
    const resultsDiv = document.getElementById('logsOutput');

    let square = null;
    let animId = null;
    let isRunning = false;
    let x, y, dx, dy;
    let eventCounter = 1;
    const speed = 10;

    playBtn.addEventListener('click', () => {
        work.style.display = 'flex';
        initSquare();
        actionBtn.textContent = 'Start';
        actionBtn.onclick = startAnim;
    });

    closeBtn.addEventListener('click', () => {
        stopAnim();
        work.style.display = 'none';
        
        const lsData = localStorage.getItem('animEvents') || '[]';
        
        fetch('server.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'save_batch',
                data: JSON.parse(lsData)
            })
        })
        .then(response => response.json())
        .then(data => {
            loadAndDisplayResults();
        });
    });

    function initSquare() {
        if (square) square.remove();
        square = document.createElement('div');
        square.id = 'square';
        anim.appendChild(square);

        x = anim.clientWidth - 10; 
        y = 0; 
        
        square.style.left = x + 'px';
        square.style.top = y + 'px';
        
        const angle = (Math.random() * (Math.PI / 2)) + (Math.PI / 4);
        dx = -Math.abs(Math.cos(angle) * speed); 
        dy = Math.abs(Math.sin(angle) * speed);
    }

    function startAnim() {
        if (!isRunning) {
            isRunning = true;
            actionBtn.textContent = 'Stop';
            actionBtn.onclick = stopAnim;
            loop();
            logEvent('Start button clicked');
        }
    }

    function stopAnim() {
        isRunning = false;
        cancelAnimationFrame(animId);
        actionBtn.textContent = 'Start';
        actionBtn.onclick = startAnim;
        logEvent('Stop button clicked');
    }

    function reloadAnim() {
        initSquare();
        actionBtn.textContent = 'Start';
        actionBtn.onclick = startAnim;
        logEvent('Reload button clicked');
    }

    function loop() {
        if (!isRunning) return;

        x += dx;
        y += dy;

        const width = anim.clientWidth;
        const height = anim.clientHeight;

        if (y <= 0) {
            y = 0;
            dy = -dy;
            logEvent('Hit Top Wall');
        } else if (y >= height - 10) {
            y = height - 10;
            dy = -dy;
            logEvent('Hit Bottom Wall');
        }

        if (x >= width - 10) {
            x = width - 10;
            dx = -dx;
            logEvent('Hit Right Wall');
        }

        if (x < -10) {
            stopAnim();
            actionBtn.textContent = 'Reload';
            actionBtn.onclick = reloadAnim;
            logEvent('Square Exited Left');
            return;
        }

        square.style.left = x + 'px';
        square.style.top = y + 'px';

        animId = requestAnimationFrame(loop);
    }

    function logEvent(message) {
        msgLog.textContent = `${eventCounter}. ${message}`;

        const now = new Date();
        const localIsoTime = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + 'T' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');

        const eventData = {
            id: eventCounter++,
            message: message,
            clientTime: localIsoTime
        };

        fetch('server.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'save_immediate',
                event: eventData
            })
        }).catch(err => console.error(err));

        const currentLS = JSON.parse(localStorage.getItem('animEvents') || '[]');
        currentLS.push({
            ...eventData,
            lsSaveTime: localIsoTime
        });
        localStorage.setItem('animEvents', JSON.stringify(currentLS));
    }

    function loadAndDisplayResults() {
        fetch('server.php?action=load')
            .then(res => res.json())
            .then(data => {
                let html = `<h4>Результати (Server Time)</h4>`;
                html += `<table id="resultsTable">
                    <thead>
                        <tr>
                            <th style="width: 30px;">ID</th>
                            <th>Msg</th>
                            <th>Client Time</th>
                            <th>Server Time (Method 1)</th>
                            <th>Server Time (Method 2 Batch)</th>
                        </tr>
                    </thead>
                    <tbody>`;
                
                data.forEach(row => {
                    const formatTime = (t) => t ? t.split('T')[1].split('.')[0] : '---';

                    const clientTime = formatTime(row.clientTime);
                    const serverTime1 = formatTime(row.serverTime_Method1);
                    const serverTime2 = formatTime(row.serverTime_Method2);

                    html += `<tr>
                        <td>${row.id}</td>
                        <td>${row.message}</td>
                        <td>${clientTime}</td>
                        <td>${serverTime1}</td>
                        <td>${serverTime2}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                
                resultsDiv.innerHTML = html;
                
                resultsDiv.scrollTop = resultsDiv.scrollHeight; 
                
                localStorage.removeItem('animEvents');
            })
            .catch(err => {
                console.error(err);
            });
    }
});