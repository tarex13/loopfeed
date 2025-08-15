import CreateLoopPage from '../features/create-loop/CreateLoopPage'
import { useUser } from '../store/useUser'
import {  useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Loading from '../components/Loading';
export default function Create() {
  const {user, loading} = useUser();
  const navigate = useNavigate()
  useEffect(()=>{
    if(loading) return
    if(!loading && !user){
      navigate("/auth");
      return;
    }
  }, [loading, user])    
  if (loading) return <Loading />
  return <CreateLoopPage />
  
}
