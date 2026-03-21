const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwtGenerator = require('../utils/jwtGenerator');

// Register (For Admin to create other users, or initial setup)
const register = async (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;

        // 0. Check system settings for registration
        const settings = await pool.query("SELECT allow_registration FROM system_settings WHERE id = 1");
        if (settings.rows.length > 0 && settings.rows[0].allow_registration === false && role !== 'admin') {
            return res.status(403).json("Public registration is currently disabled by Admin.");
        }

        // 1. Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (user.rows.length > 0) {
            return res.status(409).json("User already exists");
        }

        // 2. Bcrypt password
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // 3. Enter user inside database
        // Default role is trader if not specified.
        const userRole = role === 'admin' ? 'admin' : 'trader';
        
        const newUser = await pool.query(
            "INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [username, bcryptPassword, full_name, userRole]
        );

        // 4. Generate JWT
        const token = jwtGenerator(newUser.rows[0].id, newUser.rows[0].role);

        // 5. Set Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', 
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });

        res.json({ token, role: newUser.rows[0].role, username: newUser.rows[0].username });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 0. Check Maintenance Mode
        const settings = await pool.query("SELECT maintenance_mode FROM system_settings WHERE id = 1");
        const isMaintenance = settings.rows.length > 0 && settings.rows[0].maintenance_mode;

        // 1. Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if (user.rows.length === 0) {
            console.log(`Login failed: User '${username}' not found.`);
            return res.status(401).json("Password or Username is incorrect");
        }

        // 2. Check if incoming password is same as database password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!validPassword) {
            console.log(`Login failed: Invalid password for user '${username}'.`);
            return res.status(401).json("Password or Username is incorrect");
        }

        // 2.5 Check if user is active
        if (user.rows[0].is_active === false) {
            console.log(`Login failed: Account '${username}' is disabled.`);
            return res.status(403).json("Your account is disabled, please contact admin");
        }

        // 2.6 Check Maintenance Mode
        if (isMaintenance && user.rows[0].role !== 'admin') {
            return res.status(403).json("System is under maintenance. Please try again later.");
        }

        console.log(`Login successful for user '${username}' (${user.rows[0].role}).`);

        // 3. Give them the jwt token
        const token = jwtGenerator(user.rows[0].id, user.rows[0].role);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Needed depending on dev setup, 'strict' can be tricky with cors in dev
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });

        res.json({ 
            token, 
            role: user.rows[0].role, 
            username: user.rows[0].username,
            full_name: user.rows[0].full_name,
            profile_picture: user.rows[0].profile_picture
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

const verify = async (req, res) => {
    try {
        // req.user is set by middleware
        const user = await pool.query("SELECT id, username, role, full_name, is_active, profile_picture FROM users WHERE id = $1", [req.user.id]);
        
        if (user.rows.length === 0 || user.rows[0].is_active === false) {
            return res.status(403).json({ IsAuthenticated: false, message: 'Account disabled or not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
};

module.exports = {
    register,
    login,
    verify,
    logout
};
