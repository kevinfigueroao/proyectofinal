const apiUrl = '/api';
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const contrasena = document.getElementById('contrasena').value;
    try {
        const res = await fetch(apiUrl + '/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                contrasena
            })
        });
        const data = await res.json();
        if (data.token) {
            sessionStorage.setItem('token', data.token);
            // Redirige al calendario, por ejemplo:
            window.location.href = 'calendario-reservas.html';
        } else {
            document.getElementById('loginResult').textContent = data.error || "Error de inicio de sesión.";
        }
    } catch (err) {
        document.getElementById('loginResult').textContent = "Error de red.";
    }
});