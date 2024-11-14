 const asyncHandler = (requestHandler) => {
   return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))
 }
 }
 


export {asyncHandler} 





//  +++++++++ Breakdown of special function ++++++++++ {{{{{{  we are write this using try and catch block    }}}}}}

//  const asyncHandler = () => {}
//  const asyncHandler = (func) => () =>{}
//  const asyncHandler = (func) => async() => {} 


    // const asyncHandler= (funct) => async(req,res,next) => {
    //     try {
    //         await funct(req,res,next)
    //     } catch (error) {
    //         res.status(error.code || 500).json({
    //             success : false,
    //             message : error.message
    //         })
    //     }
    // }