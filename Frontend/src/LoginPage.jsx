import React, { useState } from 'react';
import { motion } from 'motion/react';
import './LoginPage.css';
import SoftAurora from './SoftAurora';
import RotatingText from './RotatingText';

export default function LoginPage({ onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);

    return (
        <div className="login-container">
            <SoftAurora
                speed={0.6}
                scale={1.5}
                brightness={1}
                color1="#f7f7f7"
                color2="#e100ff"
                noiseFrequency={2.5}
                noiseAmplitude={1}
                bandHeight={0.5}
                bandSpread={1}
                octaveDecay={0.1}
                layerOffset={0}
                colorSpeed={1}
                enableMouseInteraction
                mouseInfluence={0.25}
            />

            <motion.div layout className="top-left-quote">
                <motion.span layout>Every</motion.span>
                <RotatingText
                    texts={['Mile.', 'Vehicle.', 'Decision.']}
                    mainClassName="rotating-main purple-box"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="rotating-split"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={3000}
                    splitBy="characters"
                    animatePresenceMode="popLayout"
                    auto
                    loop
                />
            </motion.div>

            <div className="bottom-right-quote">
                "Manage fleets with precision,<br />
                dispatch with confidence,<br />
                and keep every journey on track."
            </div>

            {/* Login form */}
            <div className="login-form-container">
                <h2 className="form-title">{isSignUp ? "Create an account" : "Sign in to your account"}</h2>
                <p className="form-subtitle">{isSignUp ? "Enter your details to register" : "Enter your credentials to continue"}</p>

                <form className="login-form">
                    <div className="input-group">
                        <label>EMAIL</label>
                        <input type="email" placeholder="Raven.k@transitops.in" />
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <input type="password" placeholder="********" />
                    </div>

                    {isSignUp && (
                        <div className="input-group">
                            <label>CONFIRM PASSWORD</label>
                            <input type="password" placeholder="********" />
                        </div>
                    )}

                    <div className="input-group">
                        <label>ROLE (RBAC)</label>
                        <select defaultValue="Dispatcher">
                            <option value="Fleet Manager">Fleet Manager</option>
                            <option value="Dispatcher">Dispatcher</option>
                            <option value="Safety Officer">Safety Officer</option>
                            <option value="Financial Analyst">Financial Analyst</option>
                        </select>
                    </div>

                    <div className="button-group">
                        {isSignUp ? (
                            <>
                                <button type="submit" className="submit-btn" onClick={(e) => { e.preventDefault(); onLogin && onLogin(); }}>Sign Up</button>
                                <button type="button" className="secondary-btn" onClick={() => setIsSignUp(false)}>Back to Sign In</button>
                            </>
                        ) : (
                            <>
                                <button type="submit" className="submit-btn" onClick={(e) => { e.preventDefault(); onLogin && onLogin(); }}>Sign In</button>
                                <button type="button" className="secondary-btn" onClick={() => setIsSignUp(true)}>Sign Up</button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
