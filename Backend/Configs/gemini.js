const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent" 
//   -H "x-goog-api-key: $GEMINI_API_KEY" 


export const generategeminiresponse = async ({prompt,apikey,user})=>{
     try{
        if(!apikey){
            throw new Error("API key is required")
        }
        const response = await fetch(`${url}?key=${apikey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        } )

        if(!response.ok){
            if(response.status === 400 || response.status === 401){
                 user.geministatus = "inactive"
                 await user.save()
                throw new Error("Invalid API key or request")
            }

            if(response.status === 429){
                user.geministatus="quota_exceeded"
                throw new Error("Rate limit exceeded")
            }
            const error = await response.text()
            throw new Error(`Error from Gemini API: ${error}`)

        }
        user.geministatus = "active"
        user.totalmessages += 1
        await user.save()
        const data = await response.json()
        const test = data.candidates?.[0]?.content?.parts?.[0]?.text
        if(!test){
            throw new Error("Invalid response structure from Gemini API")
        }
        return test.trim()
     }
    catch(error){
        console.error("Error generating Gemini response:", error)
    }
}

