// SOLUCIÓN
import { sequelizeSession, Product, Order, Restaurant, RestaurantCategory, ProductCategory } from '../models/models.js'
import Sequelize from 'sequelize'

const indexRestaurant = async function (req, res) {
  try {
    const products = await Product.findAll({
      where: {
        restaurantId: req.params.restaurantId
      },
      include: [
        {
          model: ProductCategory,
          as: 'productCategory'
        }]
    })
    res.json(products)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  // Only returns PUBLIC information of products
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: [
        {
          model: ProductCategory,
          as: 'productCategory'
        }]
    }
    )
    res.json(product)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async function (req, res) {
  let newProduct = Product.build(req.body)
  try {
    newProduct = await newProduct.save()
    res.json(newProduct)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    await Product.update(req.body, { where: { id: req.params.productId } })
    const updatedProduct = await Product.findByPk(req.params.productId)
    res.json(updatedProduct)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Product.destroy({ where: { id: req.params.productId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted product id.' + req.params.productId
    } else {
      message = 'Could not delete product.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const popular = async function (req, res) {
  try {
    const topProducts = await Product.findAll(
      {
        include: [{
          model: Order,
          as: 'orders',
          attributes: []
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId'],
          include:
        {
          model: RestaurantCategory,
          as: 'restaurantCategory'
        }
        }
        ],
        attributes: {
          include: [
            [Sequelize.fn('SUM', Sequelize.col('orders.OrderProducts.quantity')), 'soldProductCount']
          ],
          separate: true
        },
        group: ['orders.OrderProducts.productId'],
        order: [[Sequelize.col('soldProductCount'), 'DESC']]
      // limit: 3 //this is not supported when M:N associations are involved
      })
    res.json(topProducts.slice(0, 3))
  } catch (err) {
    res.status(500).send(err)
  }
}
// SOLUCIÓN
const promote = async function (req, res) {
  const t = await sequelizeSession.transaction()
  try {
    const product = await Product.findByPk(req.params.productId)
    const existingPromotedProduct = await Product.findOne({ where: { restaurantId: product.restaurantId, promoted: true } })
    if (existingPromotedProduct) {
      await Product.update(
        { promoted: false },
        { where: { id: existingPromotedProduct.id } },
        { transaction: t }
      )
    }
    await Product.update(
      { promoted: true },
      { where: { id: product.id } },
      { transaction: t }
    )
    await t.commit()
    const updatedProduct = await Product.findByPk(req.params.productId)
    res.json(updatedProduct)
  } catch (err) {
    await t.rollback()
    res.status(500).send(err)
  }
}
/*
SOLUCIÓN SIN TRANSACCIÓN
const promote = async function (req, res) {
  try {
    const product = await Product.findByPk(req.params.productId)
    const productToBeDemoted = await Product.findOne({ where: { restaurantId: product.restaurantId, promoted: true } })
    if (productToBeDemoted) {
      productToBeDemoted.promoted = false
      await productToBeDemoted.save()
    }
    product.promoted = true
    const promotedProduct = await product.save()
    res.json(promotedProduct)
  } catch (err) {
    res.status(500).send(err)
  }
}
*/
const ProductController = {
  indexRestaurant,
  show,
  create,
  update,
  destroy,
  popular,
  promote // SOLUCIÓN
}
export default ProductController
