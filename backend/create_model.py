import tensorflow as tf
import numpy as np

# 1. Create a simple test model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(10,)),
    tf.keras.layers.Dense(1)
])
model.compile(optimizer='adam', loss='mse')

# 2. Save in both formats
model.save("Collaborative_Filtering.h5")  # Primary format
model.save("Collaborative_Filtering.keras")  # Alternate format
print("✅ Created new model files!")