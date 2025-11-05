const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise
        .resolve(requestHandler(req,res,next))
        .reject((err) => next(err));
    }
}

export default asyncHandler;

/*

# asyncHandler using try-catch and async-await

const asyncHandler = (requestHandler) => async (req, res, next) => {
    try{
        await requestHandler(req, res, next);
    }catch(err){
        res.status(err.code || 500).json({
        success : false,
        message : err.message
        })
    }
}

*/ 