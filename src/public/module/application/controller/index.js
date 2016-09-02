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
                fissions: [ ], // Todo: Remove as unused.
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
                    if (Math.random() * universe.energy < energy && !this.annihilated()) {
                        this.fission();
                    }
                };
                this.fission = function () {
                    var totalParticles = Math.floor(Math.random() * energy / 5) + 1,
                    //var totalParticles = 2,
                        i,
                        particles = [ ],
                        particle,
                        e = Math.floor(energy / totalParticles),
                        scope = this,
                        o = 0;

                    if (totalParticles > 1 && !this.annihilated()) {
                        // Energy distribution algorithm
                        for (i = 0; i < totalParticles; i += 1) {
                            particle = new Particle(e);
                            particle.location(location.clone());
                            particles.push(particle);
                        }

                        this.annihilate();

                        // Additional particle for the gradual loss of energy in the universe.
                        e = 0;
                        particles.forEach(function (particle) {
                            e += particle.energy();
                        });
                        o = universe.energy - diagnostics.energy() - e;
                        if (o > 0) {
                            particle = new Particle(o);
                            particle.location(location.clone());
                            particles.push(particle);
                        }

                        particles.forEach(function (particle) {
                            while (particle.collision(scope)) {
                                particle.move();
                            }
                        });
                    }

                    universe.particles = universe.particles.concat(particles);
                };
                this.annihilate = function () {annihilated = true; };
                this.annihilated = function () {return annihilated; };
                this.collision = function (particle) {
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
                this.move = function () {
                    var report = { },
                        x = location.x + velocity.x,
                        y = location.y + velocity.y;

                    if (x < 0 || x > universe.width) {
                        velocity.x = -velocity.x;
                        report.bounce = true;
                    } else {
                        location.x = x;
                    }

                    if (y < 0 || y > universe.height) {
                        velocity.y = -velocity.y;
                        report.bounce = true;
                    } else {
                        location.y = y;
                    }
                    return report;
                };
                this.step = function () {
                    var report = this.move();

                    if (report.bounce) {
                        this.trigger();
                    }
                };
                this.colour = function () {
                    // Use x/y as red/green or whatever
                    return {
                        red: Math.floor(location.x * 256 / universe.width),
                        green: Math.floor(location.y * 256 / universe.height),
                        blue: energy * 256 / universe.energy
                    };
                };
            },
            update,
            diagnostics = {
                energy: function () {
                    var energy = 0;
                    universe.particles.forEach(function (particle) {
                        if (!particle.annihilated()) {
                            energy += particle.energy();
                        }
                    });
                    return energy;
                },
                energyList: function () {
                    var energy = [ ];
                    universe.particles.forEach(function (particle) {
                        energy.push([
                            "Energy=",
                            particle.energy(),
                            " ",
                            (particle.annihilated()?"Annihilated":"Stable")
                        ].join(""));
                    });
                    return energy;
                }
            };

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
                    if (a !== b && !a.annihilated() && !b.annihilated()) {
                        if (a.collision(b)) {
                            add.push(a.fusion(b)); // Fusion is adding energy to the universe
                        }
                    }
                });
            });

            universe.particles = universe.particles.concat(add);

            // Update particles
            universe.particles.forEach(function (particle, idx) {
                // Possible annihilated particles here?
                // This part includes fission, which might result in annihilated particles at the fusion process
                if (particle.annihilated()) {
                    annihilate.push(idx);
                } else {
                    particle.step();
                }
            });

            var deleted = 0;
            // Destroy annihilated particles
            annihilate.forEach(function (idx) {
                if (!universe.particles[idx - deleted].annihilated()) {
                    console.log("Invalid particle annihilation", universe.particles[idx - deleted]);
                }
                universe.particles.splice(idx - deleted, 1);
                deleted += 1;
            });

            // Draw particles
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, universe.width, universe.height);
            universe.particles.forEach(function (particle) {
                ctx.strokeStyle = "rgb(" + [
                    particle.colour().red,
                    particle.colour().green,
                    particle.colour().blue
                    //Math.floor(Math.random() * 256),
                    //Math.floor(Math.random() * 256),
                    //Math.floor(Math.random() * 256),
                ].join(", ") + ")";
                ctx.beginPath();
                ctx.arc(
                    particle.location().x,
                    particle.location().y,
                    particle.size().x / 2,
                    0,
                    Math.PI * 2
                    //true
                );
                ctx.closePath();
                ctx.stroke();
            });
            if (diagnostics.energy() > universe.energy) {
                $scope.stop = true;
                console.log("Too much energy");
                console.log("Particles", universe.particles.length);
                console.log("Energy", diagnostics.energy(), "(should equal", universe.energy + ")");
                console.log("Fusions", add.length);
                console.log("Particles", diagnostics.energyList());
            }
            $scope.report.total = universe.particles.length;
            $scope.report.energy = diagnostics.energy();
            $scope.report.particles = universe.particles;

            //finished = new Date();
            //$scope.report.finished = new Date();
            //$timeout(update, 1000);
            if (!$scope.stop) {
                $timeout(update, 50);
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
