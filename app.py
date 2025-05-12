import os
from flask import Flask, render_template, jsonify, request, send_from_directory
from jinja2 import PackageLoader, Environment

# Initialize Flask app
app = Flask(__name__, 
           static_folder="static",
           template_folder="templates")

# Set app configuration
app.config['TITLE'] = "ProcureIQ™ AI Procurement Automation System"
app.config['VERSION'] = "1.0.0"
app.secret_key = os.environ.get("SESSION_SECRET", "placeholder_secret")

# Configure templates
jinja_env = Environment(loader=PackageLoader('app', 'templates'))

# Root route
@app.route("/", methods=["GET"])
def root():
    return render_template(
        "dashboard.html",
        title="ProcureIQ Dashboard"
    )

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

# Static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# RFQ Routes
@app.route("/rfq/", methods=["GET"])
def get_rfq_dashboard():
    return render_template(
        "dashboard.html",
        title="RFQ Dashboard",
        rfqs=[]  # Empty list for now
    )

@app.route("/rfq/new", methods=["GET"])
def new_rfq_form():
    return render_template(
        "rfq_entry.html",
        title="New RFQ Entry"
    )

# Basic error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error=str(e), code=404), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error=str(e), code=500), 500

# Print startup message
print("Starting ProcureIQ AI Procurement Automation System...")
