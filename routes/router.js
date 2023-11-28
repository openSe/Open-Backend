const express = require('express');
const axios = require('axios');
const qs = require('qs');
const router = express.Router()
const connection = require('../database/db')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//Rutas Mps
router.get('/',(req,res)=>{
    let data = qs.stringify({
        'grant_type': 'password',
        'username': 'pruebas@openservices.com.co',
        'password': '2P0uMBX7fO' 
        });
    
        let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://shopcommerce.mps.com.co:7965/Token',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data : data
        };
        axios.request(config)
        .then((response) => {
        res.send(JSON.stringify(response.data));
        })
        .catch((error) => {
            res.send(error);
        });
})

router.post('/catalog', async (req, res) => {
    try {
        const config = {
            method: 'post',
            url: 'https://shopcommerce.mps.com.co:7965/api/Webapi/VerCatalogo',
            headers: req.body,
        };

        const response = await axios.request(config);
        res.json(response.data);
    } catch (error) {
        console.error('Error in /catalog route:', error);
        res.status(error.response?.status || 500).json({ error: 'Request failed' });
    }
});

router.post('/envios', async (req, res) => {
    try {
    const config = {
        method: 'post',
        url: 'https://shopcommerce.mps.com.co:7965/api/Webapi/RealizarPedido',
        headers: req.body,
    };

    const response = await axios.request(config);
    res.json(response.data);
    } catch (error) {
    res.status(error.response.status || 500).json({ error: 'Request failed' });
    }
});

// Rutas del Login y register
// Register Route containing name, lastname, email, telephone, password, confirmPassword,address,totalSpent to start at 0, totalOrders to start at 0
router.post('/register', async (req, res) => {
    const { name, lastname, email, telephone, password, confirmPassword, address } = req.body;
    connection.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (results.length > 0) {
            res.json({ message: 'Email ya registrado' });
        } else if (password !== confirmPassword) {
            res.json({ message: 'Las contraseñas no son iguales' });
        } else {
            let hashedPassword = await bcrypt.hash(password, 8);
            connection.query('INSERT INTO users SET ?', {
                name: name,
                lastname: lastname,
                email: email,
                telephone: telephone,
                password: hashedPassword,
                address: address,
                totalSpent: 0,
                totalOrders: 0,
            }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    res.json({ message: 'Usuario Registreado' });
                }
            });
        }   
    });
});
//Login not to register if the email address is already registered
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        } else {
            if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
                res.json({ message: 'Email or password incorrect' });
            } else {
                const id = results[0].id;
                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true,
                };
                res.cookie('jwt', token, cookieOptions);
                res.json({ message: 'Usuarigo Logueado', token: token });
            }
        }
    });
});
//Ruta para pagos con epayco
router.post('/epayco-response/:ref_payco', async (req, res) => {
    try {
        const config = {
            method: 'post',
            url: 'https://api.secure.payco.co/payment/v1/charge/create',
            headers: req.body,
        };
    
        const response = await axios.request(config);
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status || 500).json({ error: 'Request failed' });
    }
});
module.exports = router