const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

// Generate Access Token (short-lived)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// Validate input
const validateInput = (fields) => {
  const errors = {};
  
  if (fields.username && (fields.username.length < 3 || fields.username.length > 20)) {
    errors.username = "Username must be between 3 and 20 characters";
  }
  
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Please provide a valid email";
  }
  
  if (fields.password && fields.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  
  return errors;
};

const register = async (req, res) => {
  const { username, email, password, fullName, deviceType = 'android', role = 'student' } = req.body;
  
  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "All fields are required",
      errors: { general: "Username, email, and password are required" }
    });
  }

  // Validate role và deviceType combination
  if (role === 'admin' && deviceType !== 'web') {
    return res.status(400).json({
      success: false,
      message: "Invalid access method",
      errors: { general: "Admin can only access via web" }
    });
  }

  if (role === 'student' && deviceType !== 'android') {
    return res.status(400).json({
      success: false,
      message: "Invalid access method", 
      errors: { general: "Students can only access via mobile app" }
    });
  }

  // Validate input format
  const validationErrors = validateInput({ username, email, password });
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: validationErrors
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({ 
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        errors: { [field]: `This ${field} is already taken` }
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // Create user
    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword,
      fullName,
      role,
      deviceType,
      lastLogin: new Date()
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    await User.findByIdAndUpdate(user._id, { refreshToken });

    // Response data
    const responseData = {
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          deviceType: user.deviceType,
          createdAt: user.createdAt
        },
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: "15m"
      }
    };

    // Set HTTP-only cookie for web clients (admin)
    if (deviceType === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.status(201).json(responseData);
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      errors: { general: "Something went wrong. Please try again." }
    });
  }
};

const login = async (req, res) => {
  const { email, password, deviceType = 'android' } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Email and password are required",
      errors: { general: "Please provide both email and password" }
    });
  }

  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials",
        errors: { general: "Email or password is incorrect" }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
        errors: { general: "Your account has been deactivated. Please contact support." }
      });
    }

    // Validate role và deviceType combination
    if (user.role === 'admin' && deviceType !== 'web') {
      return res.status(403).json({
        success: false,
        message: "Invalid access method",
        errors: { general: "Admin can only access via web dashboard" }
      });
    }

    if (user.role === 'student' && deviceType !== 'android') {
      return res.status(403).json({
        success: false,
        message: "Invalid access method", 
        errors: { general: "Students can only access via mobile app" }
      });
    }

    // Compare password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials",
        errors: { general: "Email or password is incorrect" }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update user with refresh token and last login
    await User.findByIdAndUpdate(user._id, { 
      refreshToken,
      lastLogin: new Date(),
      deviceType
    });

    // Response data
    const responseData = {
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          deviceType: deviceType,
          lastLogin: new Date()
        },
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: "15m"
      }
    };

    // Set HTTP-only cookie for web clients (admin)
    if (deviceType === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json(responseData);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      errors: { general: "Something went wrong. Please try again." }
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body || {};
  const cookieToken = req.cookies?.refreshToken;
  
  const refreshTokenToUse = token || cookieToken;
  
  if (!refreshTokenToUse) {
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
      errors: { general: "No refresh token provided" }
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshTokenToUse, process.env.JWT_REFRESH_SECRET);
    
    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken: refreshTokenToUse 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
        errors: { general: "Token is invalid or expired" }
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);
    
    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        tokenType: "Bearer",
        expiresIn: "15m"
      }
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      errors: { general: "Token is invalid or expired" }
    });
  }
};

// Logout
const logout = async (req, res) => {
  const { refreshToken: token } = req.body || {};
  const cookieToken = req.cookies?.refreshToken;
  
  const refreshTokenToUse = token || cookieToken;
  
  try {
    if (refreshTokenToUse) {
      // Remove refresh token from database
      await User.findOneAndUpdate(
        { refreshToken: refreshTokenToUse },
        { refreshToken: null }
      );
    }
    
    // Clear cookie
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      errors: { general: "Something went wrong during logout" }
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};