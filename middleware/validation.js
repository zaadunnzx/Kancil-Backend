const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

const schemas = {
  register: Joi.object({
    nama_lengkap: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('student', 'teacher').default('student'),
    kelas: Joi.number().integer().min(1).max(12).when('role', {
      is: 'student',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    nama_sekolah: Joi.string().max(255).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createCourse: Joi.object({
    title: Joi.string().min(3).max(255).required(),
    subject: Joi.string().valid('Matematika', 'IPA', 'IPS').required(),
    kelas: Joi.number().integer().min(1).max(12).required(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().greater(Joi.ref('start_date')).optional()
  }),  createSubCourse: Joi.object({
    course_id: Joi.number().integer().required(),
    title: Joi.string().min(3).max(255).required(),
    summary: Joi.string().max(1000).optional(),
    content_type: Joi.string().valid('video', 'pdf_material', 'quiz', 'text', 'audio', 'image', 'pdf').required(),
    content_url: Joi.string().uri().optional(), // Make optional since we can upload file
    order_in_course: Joi.number().integer().min(1).required()
  }),
  chatMessage: Joi.object({
    message: Joi.string().min(1).required(),
    sub_course_id: Joi.number().integer().required(),
    message_type: Joi.string().valid('text', 'speech_input').default('text')
  }),  updateProgress: Joi.object({
    status: Joi.string().valid('not_started', 'in_progress', 'completed').required(),
    score: Joi.alternatives().try(
      Joi.number().min(0).max(100).when('...', {
        is: Joi.object({ status: 'completed' }).unknown(),
        then: Joi.when('content_type', {
          is: 'quiz',
          then: Joi.required(),
          otherwise: Joi.valid(0, 1).optional()
        }),
        otherwise: Joi.optional()
      }),
      Joi.valid(0, 1),
      Joi.allow(null)
    ).optional(),
    content_type: Joi.string().valid('video', 'quiz', 'pdf_material', 'text', 'audio', 'image', 'pdf').optional()
  }),

  createComment: Joi.object({
    sub_course_id: Joi.number().integer().positive().required(),
    content: Joi.string().min(1).max(1000).required(),
    parent_id: Joi.number().integer().positive().optional()
  }),

  addReaction: Joi.object({
    sub_course_id: Joi.number().integer().positive().required(),
    reaction_type: Joi.string().valid('happy', 'sad', 'flat').required()
  })
};

module.exports = { validateRequest, schemas };