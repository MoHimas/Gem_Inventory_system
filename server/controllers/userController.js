const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Update User Profile
const updateProfile = async (req, res) => {
    try {
        const { full_name, password } = req.body;
        const id = req.user.id;
        let profile_picture = null;

        if (req.file) {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'gem_inventory/profiles'
            });
            profile_picture = result.secure_url;
            // Remove local file
            fs.unlinkSync(req.file.path);
        }

        let query = "UPDATE users SET full_name = $1";
        // Fallback to existing full_name if not provided
        const nameToSet = full_name || ""; 
        let params = [nameToSet];
        let paramIndex = 2;

        if (profile_picture) {
            query += `, profile_picture = $${paramIndex}`;
            params.push(profile_picture);
            paramIndex++;
        }

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const bcryptPassword = await bcrypt.hash(password, salt);
            query += `, password_hash = $${paramIndex}`;
            params.push(bcryptPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, username, full_name, role, profile_picture`;
        params.push(id);

        console.log(`Updating profile for user ID: ${id}`);
        const updateUser = await pool.query(query, params);
        
        if (updateUser.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(updateUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to update profile", details: err.message });
    }
};

module.exports = {
    updateProfile
};
