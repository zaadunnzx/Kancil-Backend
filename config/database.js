const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
    
    // Only sync in development without alter to avoid enum conflicts
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      console.log('Database synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };