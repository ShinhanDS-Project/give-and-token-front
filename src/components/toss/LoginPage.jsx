import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' }); // 💡 userId 아님! email임!

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login/user/local', formData);
      localStorage.setItem('token', response.data.accessToken);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || "로그인 실패");
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ padding: '50px', textAlign: 'center' }}>
      <input type="email" name="email" placeholder="이메일" onChange={e => setFormData({...formData, email: e.target.value})} required /><br/>
      <input type="password" name="password" placeholder="비밀번호" onChange={e => setFormData({...formData, password: e.target.value})} required /><br/>
      <button type="submit">로그인</button>
    </form>
  );
}