const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const date = require(__dirname + "/day.js");
const mongoose = require("mongoose");
const _ = require("lodash");

// var items = ["shop", "run"];
// let workItems = [];

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect(
  "mongodb+srv://admin-oisin:PASSWORD@cluster0.kgbyz.mongodb.net/todolistDB"
);

const itemsSchema = {
  name: {
    type: String,
  },
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the todo list!",
});

const item2 = new Item({
  name: "Enter anything you want!",
});

const defaultItems = [item1, item2];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, found) => {
    if (found.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) console.log(err);
        else console.log("default save successful");
      });
      res.redirect("/");
    } else {
      //console.log(found);
      res.render("list", { listTitle: "Today's", newListItem: found });
    }
  });
});

app.post("/", (req, res) => {
  var itemName = req.body.newItem;
  const listName = req.body.list;
  console.log("logging list name:" + listName);
  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today's") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, found) => {
      if (err) console.log(err);
      else if (!found) console.log("how is it not found?");
      else {
        found.items.push(newItem);
        found.save();
        res.redirect("/" + found.name);
      }
    });
  }
});

app.get("/:page", (req, res) => {
  const page = _.capitalize(req.params.page);
  List.findOne({ name: page }, (err, found) => {
    if (err) console.log(err);
    else {
      if (!found) {
        console.log("not found");
        const list = new List({
          name: page,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + list.name);
      } else {
        res.render("list", {
          listTitle: found.name,
          newListItem: found.items,
        });
      }
    }
  });
});

app.post("/delete", (req, res) => {
  //console.log(req.body.delete);
  console.log(req.body.listName);
  const checkItem = req.body.delete;
  const listName = req.body.listName;

  if (listName === "Today's") {
    Item.findByIdAndRemove(checkItem, (err) => {
      if (err) console.log(err);
      else {
        console.log("deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    console.log("custom delete" + listName);
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItem } } },
      (err, found) => {
        if (err) console.log(err);
        else res.redirect("/" + listName);
      }
    );
  }
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port 3000/remote host`);
});
