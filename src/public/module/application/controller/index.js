angular.module('application').controller("application.controller.index", [

    "$rootScope",
    "$timeout",

    function ($scope, $timeout) {

        "use strict";

        var CanvasManager = function (width, height) {
                var ctx, ready = [ ];

                this.ctx = function (canvas) {
                    if (canvas) {
                        ctx = canvas.getContext('2d');
                        ready.forEach(function (rdy) {rdy(); });
                    }
                    return ctx;
                };
                this.ready = function (fnc) {ready.push(fnc); };
                this.width = function () {return width; };
                this.height = function () {return height; };
            },
            universe = {
                fissions: [ ],
                particles: [ ],
                energy: 100,
                width: 500,
                height: 250
            },
            Vector = function (x, y) {
                this.x = x || 0;
                this.y = y || 0;
                this.clone = function () {
                    return new Vector(this.x, this.y);
                };
            },
            Particle = function (energy) {
                var location = new Vector(),
                    velocity = new Vector(),
                    size = new Vector(4, 4),
                    annihilated = false,
                    speed = energy / 10;

                // Choose the velocity based on the level of energy
                velocity.x = Math.random() * speed;
                if (Math.random() < 0.5) {velocity.x = -velocity.x;}
                velocity.y = speed - velocity.x;
                if (Math.random() < 0.5) {velocity.y = -velocity.y;}

                this.energy = function () {return energy; };
                this.size = function () {return size; };
                this.location = function (vector) {
                    if (vector) {location = vector; }
                    return location;
                };
                this.trigger = function () {
                    if (Math.random() * universe.energy < energy) {
                        this.fission();
                    }
                };
                this.fission = function () {
                    //var totalParticles = Math.floor(Math.random() * energy) + 1,
                    var totalParticles = 100 - universe.particles.length,
                        i,
                        particles = [ ],
                        particle,
                        e = energy / totalParticles;

                    //console.log("Total particles", totalParticles);
                    if (totalParticles > 1) {
                        // Energy distribution algorithm
                        for (i = 0; i < totalParticles; i += 1) {
                            particle = new Particle(e);
                            particle.location(location.clone());
                            particles.push(particle);
                        }

                        this.annihilate();
                    }

                    universe.particles = universe.particles.concat(particles);
                };
                this.annihilate = function () {annihilated = true; };
                this.annihilated = function () {return annihilated; };
                this.interference = function (particle) {
                    return (location.x < particle.location().x + particle.size().x)
                        && (location.x + size.x > particle.location().x)
                        && (location.y < particle.location().y + particle.size().y)
                        && (location.y + size.y > particle.location().y);                    
                };
                this.fusion = function (particle) {
                    // Take the total energy
                    var product = new Particle(particle.energy() + energy);

                    // Take the mean location
                    product.location(new Vector((location.x + particle.location().x) / 2,
                        (location.y + particle.location().y) / 2));

                    this.annihilate();
                    particle.annihilate();

                    return product;
                };
                this.step = function () {
                    location.x += velocity.x;
                    location.y += velocity.y;
                    if (location.x < 0 || location.x > universe.width) {
                        velocity.x = -velocity.x;
                        this.trigger();
                    }
                    if (location.y < 0 || location.y > universe.height) {
                        velocity.y = -velocity.y;
                        this.trigger();
                    }
                };
            },
            update;

        $scope.stop = false;
        $scope.cm = new CanvasManager(universe.width, universe.height);

        $scope.report = { };

        update = function () {
            // Run all updates
            var ctx = $scope.cm.ctx(),
                annihilate = [ ],
                add = [ ];

            // Todo: Handle slow-fission case,
            // where particles are stuck together
            universe.particles.forEach(function (a, idx) {
                universe.particles.forEach(function (b) {
                    if (a !== b) {
                        if (a.interference(b)) {
                            add.push(a.fusion(b));
                        }
                    }
                });
                if (a.annihilated()) {
                    annihilate.push(idx);
                }
            });

            // Destroy annihilated particles
            annihilate.forEach(function (idx) {
                universe.particles.splice(idx, 1);
            });

            universe.particles = universe.particles.concat(add);

            // Update particles
            universe.particles.forEach(function (particle) {
                particle.step();
            });

            // Draw particles
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, universe.width, universe.height);
            ctx.strokeStyle = "#fff";
            universe.particles.forEach(function (particle) {
                ctx.beginPath();
                ctx.arc(
                    particle.location().x,
                    particle.location().y,
                    particle.size().x / 2,
                    0,
                    Math.PI * 2
                    //true
                );
                ctx.stroke();
            });
            if (universe.particles.length > 100) {
                $scope.stop = true;
                console.log("Too many particles", universe.particles.length);
            }
            $scope.report.total = universe.particles.length;

            //finished = new Date();
            //$scope.report.finished = new Date();
            //$timeout(update, 1000);
            if (!$scope.stop) {
                setTimeout(function () {
                    update();
                }, 50);
            } else {
                console.log("Stopped");
            }
        };
        $scope.cm.ready(function () {
            // Create relevant particles based on universe energy level
            var particle = new Particle(universe.energy);
            particle.location().x = universe.width / 2;
            particle.location().y = universe.height / 2;
            universe.particles = [ particle ];
            
            update();
        });

    }
]);
