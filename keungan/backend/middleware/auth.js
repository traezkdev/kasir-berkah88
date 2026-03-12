import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak ditemukan." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Berisi { id, email }
        next();
    } catch (error) {
        res.status(401).json({ message: "Token tidak valid." });
    }
};
