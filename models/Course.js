const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class Course extends Sequelize.Model{}
    Course.init({
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'A title is required.',
                },
                notEmpty: {
                    msg: 'Title cannot be empty.',
                },
            },
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'A description is required',
                },
                notEmpty: {
                    msg: 'Description cannot be empty.',
                },
            },
        },
        estimatedTime: {
            type: Sequelize.STRING,
        },
        materialsNeeded: {
            type: Sequelize.STRING,
        }
    },{ sequelize });
    
    // Establish data relationship and FK
    Course.associate = (models) => {
        Course.belongsTo(models.User, {
            as: "User",
            foreignKey: {
                fieldName: "userId",
            }
        })
    }
    
    return Course;
}