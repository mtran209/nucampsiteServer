const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find()
            .populate('user.ref')
            .populate('campsites.ref')
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites)
            })
            .catch(err => {
                console.log(err);
                next(err);
            })
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findById(req.user._id)
            .populate('user.ref')
            .populate('campsites.ref')
            .then(favorite => {
                if (favorite) {
                    req.body.forEach(message => {
                        favorite.campsites.forEach(campsite => {
                            if (campsite._id === message._id) {
                                console.log('Campsite already favorited!')
                            } else {
                                campsite.findById(message._id)
                                    .then(campsite => {
                                        favorite.campsites.push(campsite);
                                        favorite.save();
                                    })
                                    .then(campsite => {
                                        console.log('Campsite added to your favorites!')
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(campsite);
                                    })
                                    .catch(err => next(err));
                            }
                        })
                    })
                } else {
                    Favorite.create(req.body)
                        .then(favorite => {
                            console.log('Favorite Created ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findByIdAndDelete(req.user._id)
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    });


//campsiteid

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findById(req.user._id)
            .then(favorite => {
                favorite.campsites.forEach(campsite => {
                    if (campsite._id === req.params.campsiteId) {
                        res.statusCode = 403;
                        res.end(`POST
                         operation not supported on /favorites`);
                    } else {
                        favorite.campsites.push(Campsite.findById(req.params.campsiteId));
                        Favorite.save()
                            .then(favorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                            .catch(err => next(err))
                    }
                })
            })
    })
    .put(cors.cors, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`)
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findById(req.user._id)
            .then(favorite => {
                favorite.campsites.filter(campsites => (campsites._id !== req.params.campsiteId));
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
            })
            .catch(err => next(err))
    });

module.exports = favoriteRouter;