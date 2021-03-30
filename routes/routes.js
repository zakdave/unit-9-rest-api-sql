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
        let errorMessage;
        const credentials = auth(req);
        if (credentials) {
            const user = await User.findOne({where: {emailAddress: credentials.name}});
            if (user) {
                const userSecret = bcrypt.compareSync(credentials.pass, user.password);
                if (userSecret) {
                    req.currentUser = user;
                } else {
                    errorMessage = `Incorrect password.`
                }
            } else {
                errorMessage = `User not found.`
            }
        } else {
            errorMessage = `No basic authorization header.`
        }
        if(errorMessage){
            res.status(401).json({errorMessage})
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
router.get('/users', authenticateUser(), asyncHandler(async (req, res, next) => {
    res.status(200).json(req.currentUser);
}));

//POST route to add a new user to the database
router.post('/users', asyncHandler(async (req, res) => {
    try {
        await User.create(req.body);
        res.location("/").status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            let errorMessageArray = [];
            error.errors.forEach(err =>  errorMessageArray.push(err.message));
            res.status(400).json({errorMessageArray});
        } else {
            throw error;
        }
    }
}));

//POST route to add course 
router.post('/courses', authenticateUser(), asyncHandler(async (req, res) => {
    try {
        const course =  await Course.create(req.body);  
        res.location(`/courses/${course.id}`);
        res.status(201).end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            let errorMessageArray = [];
            error.errors.forEach(each => errorMessageArray.push(each.message))
            res.status(400).json({errorMessageArray});
        }
    }
}));

//PUT route for editing course
router.put('/courses/:id', authenticateUser(),asyncHandler(async(req, res) => {
    let errorMessage;
    if (req.body.title && req.body.description) {
        let course = await Course.findByPk(req.params.id);
        if (course) {
            if (course.userId == req.currentUser.id) {
                await course.update(req.body);
                res.sendStatus(204);
            } else {
                errorMessage = `Only the owner can update this course.`;
                res.status(403).json({err});
            } 
        } else {
            errorMessage = 'Course not found.';
        }  
    }else{
        err = `Please provide a title and description.`;
    }
    if(err){
        res.status(400).json({err});
    }
}));

//DELETE route for specific course
router.delete('/courses/:id', authenticateUser(), asyncHandler(async (req, res) => {
    let errorMessage;
    const course = await Course.findByPk(req.params.id);
    if (course) {
        if (course.userId == req.currentUser.id) {
            await course.destroy();
            res.sendStatus(204);
        } else {
            errorMessage = `Only the owner can delete this course.`;
        }   
    } else {
        errorMessage = 'Course not found.';
    }
    if (errorMessage) {
        res.status(400).json({errorMessage});
    }
}));


module.exports = router;