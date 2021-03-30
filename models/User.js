const bcrypt = require('bcrypt')
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class User extends Sequelize.Model{}
    User.init({
        id:{
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate:{
                notNull: {
                    msg: "A first name is required."
                },
                notEmpty: {
                    msg: 'First name cannot be empty.'
                }
            }
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate:{
                notNull: {
                    msg: "A last name is required."
                },
                notEmpty: {
                    msg: 'Last name cannot be empty'
                }
            }
        },
        emailAddress: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate:{
                isEmail:{
                    msg: 'A valid email address is required.'
                },
                notNull: {
                    msg: "Must provide a email address."
                },
                notEmpty: {
                    msg: 'Email address cannot be empty.'
                }
            }
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
            set(val) {
                const hashedPass = bcrypt.hashSync(val, 10)
                this.setDataValue('password', hashedPass)
            },
            validate:{
                notNull: {
                    msg: "A password is required."
                },
                notEmpty: {
                    msg: 'Password cannot be empty.'
                }
            }
        }
    },{ sequelize });

    // Establish data relationship and FK  
    User.associate = (models) => {
        User.hasMany(models.Course, {
            as: "User",
            foreignKey: {
                fieldName: "userId",
            }
        })
    }
    
    return User;
}