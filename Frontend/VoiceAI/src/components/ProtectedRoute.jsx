import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ user, loading, children }) {
    if (loading) {
    
    return(
        <>
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
                
            </div>       
        
        
        </>
    )
}

if(!user){
    return <Navigate to="/login"/>
}

return children
}

export default ProtectedRoute