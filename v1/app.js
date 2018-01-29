var express=require("express"),
    app=express(),
    bodyParser=require("body-parser"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    LocalStrategy=require("passport-local"),
    Campground=require("./models/campground"),
    Comment=require("./models/comment"),
    User=require("./models/user"),
    seedDB=require("./seeds")
    //User=require("./models/user");

    
mongoose.connect("mongodb://localhost/back_pack");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
seedDB();

//Passport Configuration
app.use(require("express-session")({
    secret: "Hi",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser=req.user;
    next();
});

// Campground.create(
//     {
//         name: "Salmon Creek",
//         image: "https://farm4.staticflickr.com/3146/2580036389_c762496db4.jpg",
//         description: "This is a beautiful creek!!"
//     },
//     function(err, campground){
//         if(err){
//             console.log(err);
//         }
//         else{
//             console.log("NEWLY CREATED CAMPGROUND: ");
//             console.log(campground);
//             //res.redirect("/campgrounds");
//         }
//     }
//     )


app.get("/", function(req,res){
    res.render("landing");
});

//  var campgrounds=[
//         {name: "Salmon Creek", image: "https://farm4.staticflickr.com/3146/2580036389_c762496db4.jpg"},
//         {name: "Granite Hill", image: "https://farm7.staticflickr.com/6134/5985692540_e9539f9ab4.jpg"},
//         {name: "Mountain Goat's rest", image: "https://farm9.staticflickr.com/8537/29537096513_db5c3723f7.jpg"},
//         {name: "Salmon Creek", image: "https://farm4.staticflickr.com/3146/2580036389_c762496db4.jpg"},
//         {name: "Granite Hill", image: "https://farm7.staticflickr.com/6134/5985692540_e9539f9ab4.jpg"},
//         {name: "Mountain Goat's rest", image: "https://farm9.staticflickr.com/8537/29537096513_db5c3723f7.jpg"},
//         {name: "Salmon Creek", image: "https://farm4.staticflickr.com/3146/2580036389_c762496db4.jpg"},
//         {name: "Granite Hill", image: "https://farm7.staticflickr.com/6134/5985692540_e9539f9ab4.jpg"},
//         {name: "Mountain Goat's rest", image: "https://farm9.staticflickr.com/8537/29537096513_db5c3723f7.jpg"}
//         ]
        
//INDEX-show all campgrounds     
app.get("/campgrounds", function(req, res){
        //Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
            if(err){
           console.log(err);
       }else{
           res.render("campgrounds/index",{campgrounds:allCampgrounds, currentUser: req.User});
       }
        });
        //res.render("campgrounds",{campgrounds:campgrounds});
});

//CREATE-add new campground to database
app.post("/campgrounds", function(req, res){
    //res.send("YOU HIT THE POST ROUTE!");
    //get data from form and add to campgrounds array
    var name=req.body.name;
    var image=req.body.image;
    var desc=req.body.description;
    var newCampground={name:name,image:image, description: desc};
    //campgrounds.push(newCampground);
    //Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        }
        else{
    //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
    
});

//NEW-show form to create new campground
app.get("/campgrounds/new", function(req, res){
    res.render("campgrounds/new");
});

//SHOW-shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        }
        else{
            console.log(foundCampground);
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
   // req.params.id
    //render show template with that campground
   // res.render("show");
});

//==================
//COMMENTS ROUTES
//==================

app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){
    //find campground by id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground: campground});
        }
    })
});

app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res){
    //lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }else{
                    campground.comments.push(comment);
                    campground.save();
                    
                    res.redirect('/campgrounds/' + campground._id);
                }
            });
        } 
    });
    //create new comment
    //connect new comment to campground
    //redirect campground show page
});

//===========
//AUTH ROUTES
//===========

//show register form
app.get("/register", function(req,res){
    res.render("register");
});
//handle sign up logic
app.post("/register", function(req, res){
    var newUser=new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/campgrounds"); 
        });
    });
});

//show login form
app.get("/login", function(req, res){
    res.render("login");
});
//handling login logic
app.post("/login", passport.authenticate("local",
{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}),
function(req, res){
});

//logic route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/campgrounds");
});

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("backpack has started");
});








