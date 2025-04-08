/**
 * Intel Ultrabook Campaign (2013)
 * Badge Selection System - Code Sample
 * 
 * This file demonstrates the implementation of the interactive processor badge
 * selection system from the Intel Ultrabook campaign. This was an innovative
 * feature in 2013 that allowed users to explore different Intel processors.
 */

/**
 * Badge Navigation Setup
 * This function handles the setup of the badge selection system, including
 * click handlers and content management.
 */
function badgeNav() {
  // Store processor IDs for reference
  var processor = [];
  
  // Process each processor section
  $('#badges .processor').each(function(i) {
    processor[i] = $(this).attr('id');
    var alt = $(this).children('h2').text();

    // Add badge images and close buttons to each processor section
    if (processor[i] !== 'compare-processors') {
      $(this)
        .prepend('<img src="' + root + 'images/badge-large-' + processor[i] + '.png" alt="' + alt + '">')
        .prepend('<a class="close">Close X</a>');

      // Add compare button for Core processors (i3, i5, i7)
      if (processor[i].slice(0, 1) == 'i') {
        $(this).append('<a class="cta compare" onclick="compareProcessors($(this));"><img class="compareBtn" src="' + root + 'images/_layout/compare-processors.png" alt="Compare Core processors"></a>');
      }
    }
  });

  // Add processor class to each badge navigation item
  $('#badges #trm-badge-nav li').each(function(i) {
    $(this).addClass(processor[i]);
  });

  // Bind click event to badge navigation items
  $('#badges #trm-badge-nav li').bind({
    click: function() {
      var badge = processor[$(this).index()];
      
      // Smooth scroll to processors section
      var destination = $('#processors').offset().top;
      $("html:not(:animated),body:not(:animated)").animate(
        { scrollTop: destination - 10 },
        500,
        'linear',
        function() {
          // If compare processors overlay is showing, hide it
          if ($('#trmContainer #compare-processors').css('display') == 'block') {
            $('#trmContainer #compare-processors').css('display', 'none');
          }

          // Toggle description visibility
          descToggle(badge);
        }
      );
    }
  });

  /**
   * Toggle Description Visibility
   * Hides the currently visible description, then shows the description
   * for the selected badge.
   */
  function descToggle(badge) {
    $('#badges .processor.expanded, #badges .cta.expanded')
      .hide()
      .removeClass('expanded');
    
    $('#' + badge + ' .compare').removeAttr('style');
    
    $('#' + badge)
      .slideDown(600)
      .addClass('expanded');
  }

  // Close button functionality
  $('#badges .processor .close').click(function() {
    $('#badges .cta')
      .fadeOut()
      .removeClass('expanded')
      .removeAttr('style');
    
    $(this).parent()
      .slideToggle(300, 'linear', function() {
        $(this)
          .removeClass('expanded')
          .removeAttr('style');
      });
  });
}

/**
 * Particle Animation Initialization
 * This code initializes the particle animation system that creates
 * the confetti-like effect when users interact with processor badges.
 */
function initializeParticleAnimation() {
  // Set up particle animation container
  var particleFolder = root + 'images/Renders/particles/';
  
  // Initialize jsMovie for particle animation
  $('#movie').jsMovie({
    sequence: "ParticlesLayered_###.png", 
    from: 1, 
    to: 120, 
    step: 1, 
    folder: particleFolder,
    height: "72px", 
    width: "724px", 
    fps: 24, 
    playOnLoad: false,
    showPreLoader: true
  });
  
  // Trigger animation on badge click
  $("#trm-badge-nav li").click(function() {
    // Get badge index
    var badgeIndex = $(this).index() + 1;
    
    // Position the star elements for the animation
    positionStarElements(badgeIndex);
    
    // Play the particle animation
    $("#movie").jsMovie("play", 1, 120, true, false, 5, "738px", "72px");
  });
}

/**
 * Position Star Elements
 * This function positions the star elements based on which badge was selected.
 * Each processor badge has a different starting position for the animation.
 */
function positionStarElements(badgeIndex) {
  // Base position calculations
  var baseLeft = 150 * (badgeIndex - 1) + 25;
  
  // Position each star element
  $('#trm-pov-badge-star1').css({
    'left': baseLeft + 'px'
  });
  
  $('#trm-pov-badge-star2').css({
    'left': (baseLeft + 30) + 'px'
  });
  
  $('#trm-pov-badge-star3').css({
    'left': (baseLeft - 15) + 'px'
  });
  
  $('#trm-pov-badge-star4').css({
    'left': (baseLeft + 15) + 'px'
  });
  
  $('#trm-pov-badge-star5').css({
    'left': (baseLeft - 30) + 'px'
  });
}

/**
 * Compare Processors
 * This function handles the display of the processor comparison overlay
 * when users click on the "Compare Processors" button.
 */
function compareProcessors(target) {
  // Add close button if it doesn't exist
  if ($('#badges #compare-processors .close').length == 0) {
    $('#badges #compare-processors').prepend('<a class="close" onclick="closeMe($(this).parent());"><img src="' + root + 'images/_layout/close.png" alt="Close"></a>');
  }

  // Show the comparison overlay
  $('#badges #compare-processors').fadeIn(300);
}

/**
 * Close Overlay
 * This function handles closing the comparison overlay.
 */
function closeMe(target) {
  target.fadeOut(300);
}

/**
 * Cross-Browser Compatibility
 * This function handles browser detection and applies appropriate fixes
 * for different browsers, particularly Internet Explorer.
 */
function iefix() {
  var ua = navigator.userAgent.match('MSIE');
  var version = ua !== null ? parseInt(navigator.userAgent.split('MSIE')[1].slice(1)) : null;
  
  if (ua !== null) {
    $('#trmContainer').addClass('MSIE');
    
    if (version < 9) {
      $('#trmContainer').addClass('ie' + version);
      
      $('#trmContainer #povContainer .laptop .views li').each(function(i) {
        $(this).addClass('child' + (i + 1));
      });

      if (version == 7) {
        // Hide page elements for IE7
        $('#badges, #performance, #footnotes, nav#main, #railImage').css('display', 'none');

        // Show IE9 download message for IE7 users
        var ie9redir = new Image();
        ie9redir.src = root + 'images/ie7-backup-image.jpg';
        ie9redir.alt = 'Download IE9 here';

        $('#trmContainer #povContainer')
          .html(ie9redir)
          .append('<a class="ie9-download" href="http://windows.microsoft.com/en-US/internet-explorer/downloads/ie-9/worldwide-languages"><img src="' + root + 'images/blank.png" alt="Download IE9 here" width="230" height="36"></a>');

        return false;
      }
    }
  }
}

// Document ready handler
$(document).ready(function() {
  // Initialize browser compatibility fixes
  iefix();
  
  // Initialize the badge navigation system
  badgeNav();
  
  // Initialize the particle animation system
  initializeParticleAnimation();
  
  // Apply additional style helpers
  styleHelpers();
});
