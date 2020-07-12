var express = require('express')
var hbs  = require('express-handlebars')
var fs = require('fs')
var bodyParser = require('body-parser')
const {MongoClient} = require('mongodb')
var ObjectId = require('mongodb').ObjectID

var app = express()
app.use(express.static(__dirname + '/public'));

//handlebars
app.engine('handlebars', hbs(
  {
    defaultLayout: 'main',
    helpers: {
      // Function to do basic mathematical operation in handlebars
      math: function(lvalue, operator, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue,
            "=": lvalue == rvalue
        }[operator];
      },
      isElement: function(ele, arr) {
        if (arr == null) {
          return false
        }
        return arr.includes(ele)
      },
      eq: function(a, b) {
        return a == b
      },
      even: function(num) {
        value = parseFloat(num);
        return (value % 2) == 0
      },
      tilesPerRow: function(size) {
        var numPerRow
        switch(size) {
          case "lg":
            numPerRow = 2
            break;
          case "sm":
            numPerRow = 6
            break;
          default:
            numPerRow = 4
        }
        return numPerRow
      },
      parentObject: function(name) {
        return '../Meat'
        // return `../${name}`
      },
      truncate: function(name, size) {
        //temporayy bc i cant tell between chiense and english
        if (name.length > 20) {
          return name.substring(0, 20) + "..."
        }
        return name
        lgCutoff = 40
        mdCutoff = 15
        smCutoff = 7
        switch(size) {
          case "lg":
            if(name.length > lgCutoff) {
              return name.substring(0, lgCutoff) + "..."
            }
            return name
          case "md":
            if(name.length > mdCutoff) {
              return name.substring(0, mdCutoff) + "..."
            }
            return name
          case "sm":
            if(name.length > smCutoff) {
              return name.substring(0, smCutoff) + "..."
            }
            return name
          }
       }
    }
  }));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//database
const uri = "mongodb+srv://apanpanpan:joLLyrancher@panfam-csx0a.mongodb.net/test?retryWrites=true&w=majority"
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true})
var recipes
var meals

client.connect().then(client => {
  console.log("connected")
  recipes = client.db("data").collection("recipes")
  meals = client.db("data").collection("meals")
})

//routes
app.get('/', function (req, res) {
  res.render('home')
})

app.get('/recipes', function (req, res) {
  query = {}
  size = "md"

  //filtering
  if (req.query.categories) {
    if (typeof req.query.categories === 'string') {
      //only one element
      query = {categories: req.query.categories}
      req.query.categories = [req.query.categories]
    } else {
      var arr = []
      for (cat of req.query.categories) {
        arr.push({categories: cat})
      }
      query = { $or: arr}
    }
  }
  if (req.query.text) {
    var arr = []
    arr.push({categories: {$regex : `.*${req.query.text}.*`}})
    arr.push({ingredients: {$regex : `.*${req.query.text}.*`}})
    arr.push({name: {$regex : `.*${req.query.text}.*`}})
    query = { $or: arr }
  }

  //view size
  if (req.query.size) {
    size = req.query.size
  }

  //if rerendering from a filter
  fromSelect = false
  if (req.query.fromSelect) {
    fromSelect = req.query.fromSelect
  }

  recipes.find(query).toArray()
    .then(results => {
      res.render('recipes', {
        "foodArray": results,
        "categories": req.query.categories,
        "size": size,
        "text": req.query.text,
        "fromSelect": fromSelect,
      })
      return
    })
    .catch(error => console.error(error))
})

app.post('/recipes', function (req, res) {
  var query = {_id: new ObjectId(req.body.id)}
  size = "md"
  count = 0

  recipes.deleteOne(query)
  .then(results => {
    mealQuery = {foodItems:{$elemMatch:{foodId:req.body.id}}}
    meals.find(mealQuery).toArray()
    .then(mealArr => {
      //recipe is not in any meals
      if (mealArr.length == 0) {
        recipes.find().toArray()
        .then(results => {
          res.render('recipes', {
            "foodArray": results,
            "size": size,
          })
        }).catch(error => console.error(error))
      } else {
        //need to update meals
        doneCount = mealArr.length
        var finish = function() {
          count = count + 1
          if (count == doneCount) {
            recipes.find().toArray()
            .then(results => {
              console.log("deleted")
              res.render('recipes', {
                "foodArray": results,
                "size": size,
              })
            }).catch(error => console.error(error))
          }
        }

        //updating each meal
        for (meal of mealArr) {
          meal.foodItems = meal.foodItems.filter(function(value, index, arr){ return value.foodId != req.body.id;})
          mealQuery = {_id: ObjectId(meal._id)}
          if (meal.foodItems.length == 1) {
            meals.deleteOne(mealQuery)
            .then(updatedMeal => {
              finish()
            })
            .catch(error => console.error(error))
          } else {
            meals.updateOne(mealQuery, {$set: {foodItems: meal.foodItems}})
            .then(updatedMeal => {
              finish()
            }).catch(error => console.error(error))
          }
        }
      }
    })
    .catch(error => console.error(error))
  })
  .catch(error => console.error(error))
})

app.get('/addRecipe', function (req, res) {
  res.render('recipeForm', {
    title: "Add a Recipe",
    actionurl: "/addRecipe",
    method: "POST"
  })
})

app.post('/addRecipe', function (req, res) {
  req = processInput(req)

  recipes.insertOne(req.body)
  .then(result => {
    console.log(`New recipe added with the id: ${result.insertedId}`)
    res.render('recipeForm', {
      message: "Sucessfully Added!",
      title: "Add a Recipe",
      actionurl: "/addRecipe",
      method: "POST"
    })
  })
  .catch(error => {
    console.error(error)
    req.body.message = "An error occured in the database connection. Please try again."
    req.body.title = "Add a Recipe"
    req.body.actionurl = "/addRecipe"
    req.body.method = "POST"
    res.render('recipeForm', req.body)
  })
})

app.get('/editRecipe', function (req, res) {
  var query = {_id: ObjectId(req.query.id)}

  recipes.findOne(query)
  .then(result => {
    result.title = "Edit Recipe"
    result.actionurl = '/editRecipe'
    result.method = "POST"
    res.render('recipeForm', result)
  })
  .catch(error => console.error(error))
})

app.post('/editRecipe', function(req, res) {
  var query = {_id: ObjectId(req.body.id)}
  size = 'md'
  count = 0

  req = processInput(req)

  recipes.updateOne(query, {$set: req.body})
  .then(result => {
    mealQuery = {foodItems:{$elemMatch:{foodId:req.body.id}}}
    meals.find(mealQuery).toArray()
    .then(mealArr => {
      //recipe is not in any meals
      if (mealArr.length == 0) {
          req.body.message = "Sucessfully Edited!"
          req.body._id = req.body.id
          res.render('recipe', req.body)
      } else {
        //need to update meals
        doneCount = mealArr.length
        var finish = function() {
          count = count + 1
          if (count == doneCount) {
            req.body.title = "Edit Recipe"
            req.body.actionurl = '/editRecipe'
            req.body.method = "POST"
            req.body.message = "Sucessfully Edited!"
            req.body._id = req.body.id
            res.render('recipe', req.body)
          }
        }

        //updating each meal
        for (meal of mealArr) {
          for(food of meal.foodItems) {
            if (food.foodId == req.body.id) {
              food.url = req.body.url[0]
              mealQuery = {_id: ObjectId(meal._id)}
              meals.updateOne(mealQuery, {$set: {foodItems: meal.foodItems}})
              .then(updatedMeal => {
                finish()
              }).catch(error => console.error(error))
            }
          }
        }
      }
    })
    .catch(error => console.error(error))
  })
  .catch(error => console.error(error))
})

app.get('/recipe', function (req, res) {
  var query = {_id: ObjectId(req.query.id)}

  recipes.findOne(query)
  .then(result => {
    res.render('recipe', result)
  })
  .catch(error => console.error(error))
})

app.get('/meals', function (req, res) {
  meals.find().toArray()
  .then(results => {
    res.render('meals', {
      "meals": results
    })
  })
  .catch(error => console.error(error))
})

app.get('/addMeal', function(req, res) {
  recipes.find().toArray()
  .then(results => {
    res.render('addMeal', {
      'foodArray': results,
      'successfullyAdded': false
    })
  })
  .catch(error => console.error(error))
})

app.post('/addMeal', function(req, res) {
  if (req.body.foodItems == null || typeof req.body.foodItems === 'string') {
    //0 or 1 item was selected
    res.render('addMeal', {
      'successfullyAdded': false
    })
  } else {
    cleanUp = req.body.foodItems.map(x => {
      req.temp = {
        "foodId": x.split(' ')[0],
        "url": x.split(' ')[1]
      }
      return req.temp;
    })
    req.body.foodItems = cleanUp

    meals.insertOne(req.body)
    .then(result => {
      console.log(`New meal added with the id: ${result.insertedId}`)
      recipes.find().toArray()
      .then(results => {
        res.render('addMeal', {
          'foodArray': results,
          'successfullyAdded': true
        })
      })
    })
    .catch(error => console.error(error))
  }
})

app.get('/documentation', function(req, res) {
  res.render('documentation')
})

app.listen(process.env.PORT || 3000, function() {
  console.log('running')
})

function processInput(req) {
  if (typeof req.body.url === 'string') {
    req.body.url = [req.body.url]
  }
  req.body.url = req.body.url.filter(item => item.length > 0)
  if (req.body.ingredients) {
    if (typeof req.body.ingredients === 'string') {
      req.body.ingredients = [req.body.ingredients]
    }
    req.body.ingredients = req.body.ingredients.filter(item => item.length > 0)
  }
  if (req.body.categories && typeof req.body.categories === 'string') {
    req.body.categories = [req.body.categories]
  }
  if (req.body.categories == null) {
    req.body.categories = ""
  }
  return req
}
