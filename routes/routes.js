const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('basic-auth');
const {User, Course} = require('../models');


const asyncHandler = (cb) => {
    return async(req, res, next) => {
        try {
            await cb (req, res, next)
        } catch (error) {
            next(error)
        }
    }
}

const authenticateUser = () => {
    return async(req, res, next) =>{
        let err;
        const credentials = auth(req);
        if(credentials){
            const user = await User.findOne({where: {emailAddress: credentials.name}});
            if(user){
                const userSecret = bcrypt.compareSync(credentials.pass, user.dataValues.password);
                if(userSecret){
                    req.currentUser = user;
                }else{
                    err = `Password did not match.`
                }
            }else{
                err = `No user was found.`
            }
        }else {
            err = `Auth header was not found.`
        }
        if(err){
            res.status(401).json({err})
        }
        next();
    }
}

// GET route for courses data and user who created each course
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
        include: [
            {
                model: User,
                as: "User",
                attributes: [
                    'firstName',
                    'lastName',
                    'emailAddress'
                ]
            },
        ],
        attributes: [
            'id',
            'title',
            'description',
            'estimatedTime',
            'materialsNeeded',
            'userId'
        ]
    });
    res.status(200).json(courses);
}));

//GET route for specific course
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: [
            'id',
            'firstName',
            'lastName',
            'emailAddress'
          ]
        }
      ],
      attributes: [
        'id',
        'title',
        'description',
        'estimatedTime',
        'materialsNeeded'
      ]
    });
    res.status(200).json(course);
}));

//GET route for authenticated user
router.get('/users', authenticateUser(), asyncHandler(async(req, res, next) => {
    res.status(200).json(req.body);
}));

//POST route to add a new user to the database
router.post('/users', asyncHandler(async(req, res) => {
    let err;
    try{
        await User.create(req.body);
        res.location("/").status(201).end();
    }catch(error){
        if(error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError'){
            let errors = [];
            error.errors.forEach(err =>  errors.push(err.message));
            res.status(400).json({errors});
        } else {
            throw error;
        }
    }
}));

//POST route to add course 
router.post('/courses', authenticateUser(), asyncHandler(async(req, res) => {
    try{
        console.log(req.req);
        const course =  await Course.create(req.body);  
        res.location(`/courses/${course.dataValues.id}`);
        res.status(201).end();
    }catch(error){
        if(error.name === 'SequelizeValidationError'){
            let errors = []
            error.errors.forEach(err => errors.push(err.message))
            res.status(400).json({errors});
        }
        
        throw error;
    }
}));

//DELETE route for specific course
router.delete('/courses/:id', authenticateUser(),asyncHandler(async(req, res) => {
    let course = await Course.findByPk(req.params.id);
    let err;
    if(course){
        if(course.dataValues.userId == req.currentUser.dataValues.id){
            await course.destroy();
            res.sendStatus(204);
        }else{
            err = `Must be the owner of this course to delete.`;
        }   
    }else{
        throw error = new Error('Query not found');
    }
    if(err){
        res.status(403).json({err});
    }
}));

//Test route
router.get('/test', asyncHandler(async (req,res) => {
    console.log(req.body);
}))

module.exports = router;